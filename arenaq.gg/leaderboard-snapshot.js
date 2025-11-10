const dotenv = require('dotenv');
dotenv.config();

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const {
  TRACKER_REGIONS,
  getAccessToken,
} = require('./tracker-snapshot');

const OUTPUT_PATH = path.join(__dirname, 'data', 'leaderboard-top.json');
const BRACKETS = ['2v2', '3v3', '5v5'];
const MAX_ENTRIES_PER_BRACKET = 800;
const SUMMARY_TIMEOUT_MS = 1500;
const SUMMARY_CONCURRENCY = 12;

const ensureOutputDir = () => {
  const dir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const writeJson = data => {
  ensureOutputDir();
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2), 'utf-8');
};

const resolveSeasonId = async (region, token) => {
  const namespace = `dynamic-classic-${region}`;
  const url = `https://${region}.api.blizzard.com/data/wow/pvp-season/index?namespace=${namespace}&locale=en_GB`;
  const { data } = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const currentSeasonId = data?.current_season?.id;
  if (typeof currentSeasonId === 'number') {
    return currentSeasonId;
  }

  const ids = Array.isArray(data?.seasons)
    ? data.seasons
        .map(season => season?.id)
        .filter(id => typeof id === 'number')
    : [];
  if (!ids.length) {
    throw new Error(`Unable to determine season for region ${region}`);
  }
  return Math.max(...ids);
};

const fetchLeaderboard = async (region, seasonId, bracket, token) => {
  const namespace = `dynamic-classic-${region}`;
  const url = `https://${region}.api.blizzard.com/data/wow/pvp-season/${seasonId}/pvp-leaderboard/${bracket}?namespace=${namespace}&locale=en_GB`;
  const { data } = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const entries = Array.isArray(data?.entries) ? data.entries : [];
  return entries.slice(0, MAX_ENTRIES_PER_BRACKET);
};

const fetchCharacterSummary = async (region, realmSlug, name, token) => {
  const namespace = `profile-classic-${region}`;
  const realm = encodeURIComponent(realmSlug.toLowerCase());
  const character = encodeURIComponent(name.toLowerCase());
  const url = `https://${region}.api.blizzard.com/profile/wow/character/${realm}/${character}?namespace=${namespace}&locale=en_GB`;
  try {
    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: SUMMARY_TIMEOUT_MS,
    });
    return data;
  } catch (err) {
    if (err?.response?.status === 404 || err?.response?.status === 403) {
      return null;
    }
    throw err;
  }
};

const buildEntry = (entry, summary, region) => {
  const rank = entry?.rank ?? null;
  const rating = entry?.rating ?? null;
  const wins = entry?.season_match_statistics?.won ?? null;
  const losses = entry?.season_match_statistics?.lost ?? null;
  const characterId = entry?.character?.id ?? null;

  const className =
    summary?.character_class?.name?.en_GB ??
    summary?.character_class?.name ??
    'Unknown';
  const classSlug = className !== 'Unknown' ? slugify(className) : null;
  const classId = summary?.character_class?.id ?? null;

  const specName = summary?.active_spec?.name ?? null;
  const specSlug = specName ? slugify(specName) : null;
  const raceName =
    summary?.race?.name?.en_GB ??
    summary?.race?.name ??
    null;
  const raceId = summary?.race?.id ?? null;
  const raceSlug = raceName ? slugify(raceName) : null;
  const raceIcon = buildRaceIconUrl(raceId, region);

  const faction =
    summary?.faction?.name?.en_GB ??
    summary?.faction?.name ??
    summary?.faction?.type ??
    null;

  const gender =
    summary?.gender?.name?.en_GB ??
    summary?.gender?.name ??
    summary?.gender?.type ??
    null;

  const realmSlug =
    summary?.realm?.slug ??
    entry?.character?.realm?.slug ??
    'unknown';

  const realmName =
    summary?.realm?.name?.en_GB ??
    summary?.realm?.name ??
    entry?.character?.realm?.name ??
    realmSlug;

  const routeName = summary?.name ?? entry?.character?.name ?? 'Unknown';
  const name = entry?.character?.name ?? entry?.name ?? routeName;
  const regionCode = String(region ?? '').toUpperCase() || null;

  return {
    characterId,
    name,
    routeName,
    realmSlug,
    realmName,
    faction,
    classId,
    className,
    classSlug,
    specName,
    specSlug,
    race: raceName,
    raceId,
    raceSlug,
    raceIcon,
    rank,
    rating,
    wins,
    losses,
    gender,
    region: regionCode,
  };
};

const slugify = value =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const buildRaceIconUrl = (raceId, region) => {
  if (typeof raceId !== 'number' || !Number.isFinite(raceId)) {
    return null;
  }
  const shard = String(region ?? '')
    .toLowerCase()
    .startsWith('us')
    ? 'us'
    : 'eu';
  return `https://render.worldofwarcraft.com/classic-${shard}/race/${raceId}-0.jpg`;
};

const buildRegionSnapshot = async (region, token) => {
  const seasonId = await resolveSeasonId(region, token);
  const cache = new Map();

  const result = {
    seasonId,
    generatedAt: new Date().toISOString(),
    brackets: {},
  };

  for (const bracket of BRACKETS) {
    const entries = await fetchLeaderboard(region, seasonId, bracket, token);

    const enriched = await enrichEntries(entries, region, token, cache);
    const cutoffs = computeCutoffs(enriched);

    result.brackets[bracket] = {
      generatedAt: new Date().toISOString(),
      totalEntries: enriched.length,
      entries: enriched,
      cutoffs,
    };
  }

  return result;
};

const enrichEntries = async (entries, region, token, cache) => {
  const results = [];
  let index = 0;

  while (index < entries.length) {
    const batch = entries.slice(index, index + SUMMARY_CONCURRENCY);
    index += SUMMARY_CONCURRENCY;

    const summaries = await Promise.all(
      batch.map(async entry => {
        const realmSlug =
          entry?.character?.realm?.slug ??
          slugify(entry?.character?.realm?.name) ??
          '';
        const name = entry?.character?.name ?? '';
        const cacheKey = `${region}:${realmSlug}:${name}`.toLowerCase();

        if (!realmSlug || !name) {
          return { entry, summary: null };
        }

        if (cache.has(cacheKey)) {
          return { entry, summary: cache.get(cacheKey) };
        }

        const summary = await fetchCharacterSummary(region, realmSlug, name, token);
        cache.set(cacheKey, summary);
        return { entry, summary };
      })
    );

    for (const { entry, summary } of summaries) {
      if (!summary) {
        continue;
      }
      results.push(buildEntry(entry, summary, region));
    }

    if (index < entries.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  return results;
};

const computeCutoffs = entries => {
  const rated = entries
    .filter(entry => Number.isFinite(entry.rating ?? NaN))
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

  const total = rated.length;
  if (!total) {
    return {
      rank1: null,
      gladiator: null,
    };
  }

  const rank1Index = indexForPercent(total, 0.001);
  const gladiatorIndex = indexForPercent(total, 0.005);

  return {
    rank1: rated[rank1Index]?.rating ?? null,
    gladiator: rated[gladiatorIndex]?.rating ?? null,
  };
};

const indexForPercent = (total, percent) => {
  if (!Number.isFinite(percent) || percent <= 0) {
    return 0;
  }
  const position = Math.max(0, Math.floor(total * percent) - 1);
  return Math.min(total - 1, position);
};

const readExistingSnapshot = () => {
  try {
    if (!fs.existsSync(OUTPUT_PATH)) {
      return { generatedAt: '', regions: {} };
    }
    const raw = fs.readFileSync(OUTPUT_PATH, 'utf-8');
    return JSON.parse(raw) || { generatedAt: '', regions: {} };
  } catch {
    return { generatedAt: '', regions: {} };
  }
};

const buildLeaderboardSnapshot = async ({
  regions = TRACKER_REGIONS,
} = {}) => {
  const tokenInfo = await getAccessToken();
  const token = tokenInfo.token;
  const existing = readExistingSnapshot();
  const snapshot = {
    generatedAt: new Date().toISOString(),
    regions: { ...(existing.regions ?? {}) },
  };

  for (const region of regions) {
    try {
      snapshot.regions[region] = await buildRegionSnapshot(region, token);
    } catch (err) {
      console.error(
        `Failed to build leaderboard snapshot for ${region}`,
        err.message
      );
      if (existing.regions?.[region]) {
        console.warn(`Reusing cached leaderboard dataset for ${region}`);
        snapshot.regions[region] = existing.regions[region];
      }
    }
  }

  writeJson(snapshot);
  return snapshot;
};

module.exports = {
  OUTPUT_PATH,
  buildLeaderboardSnapshot,
};
