const dotenv = require('dotenv');
dotenv.config();

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const {
  TRACKER_REGIONS,
  getAccessToken,
} = require('./tracker-snapshot');

const OUTPUT_PATH = path.join(__dirname, 'data', 'bis-top.json');
const BRACKETS = ['2v2', '3v3', '5v5', 'rbg'];
const CLASS_META = [
  { id: 6, name: 'Death Knight', slug: 'death-knight' },
  { id: 11, name: 'Druid', slug: 'druid' },
  { id: 3, name: 'Hunter', slug: 'hunter' },
  { id: 8, name: 'Mage', slug: 'mage' },
  { id: 10, name: 'Monk', slug: 'monk' },
  { id: 2, name: 'Paladin', slug: 'paladin' },
  { id: 5, name: 'Priest', slug: 'priest' },
  { id: 4, name: 'Rogue', slug: 'rogue' },
  { id: 7, name: 'Shaman', slug: 'shaman' },
  { id: 9, name: 'Warlock', slug: 'warlock' },
  { id: 1, name: 'Warrior', slug: 'warrior' },
];

const CLASS_INDEX = new Map(CLASS_META.map(meta => [meta.id, meta]));
const CLASS_SLUG_INDEX = new Map(CLASS_META.map(meta => [meta.slug, meta]));

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

const slugify = value =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const resolveSeasonId = async (region, token) => {
  const namespace = `dynamic-classic-${region}`;
  const indexUrl = `https://${region}.api.blizzard.com/data/wow/pvp-season/index?namespace=${namespace}&locale=en_GB`;
  const { data } = await axios.get(indexUrl, {
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
  return Array.isArray(data?.entries) ? data.entries : [];
};

const fetchCharacterSummary = async (region, realmSlug, nameSlug, token, timeoutMs = 1500) => {
  const namespace = `profile-classic-${region}`;
  const realm = encodeURIComponent(realmSlug.toLowerCase());
  const name = encodeURIComponent(nameSlug.toLowerCase());
  const url = `https://${region}.api.blizzard.com/profile/wow/character/${realm}/${name}?namespace=${namespace}&locale=en_GB`;
  try {
    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: timeoutMs,
    });
    return data;
  } catch (err) {
    if (err?.response?.status === 404 || err?.response?.status === 403) {
      return null;
    }
    throw err;
  }
};

const buildPlayerRecords = (leaderboards, region) => {
  const players = new Map();
  for (const bracket of BRACKETS) {
    const entries = leaderboards.get(bracket) || [];
    for (const entry of entries) {
      const id = entry?.character?.id;
      if (typeof id !== 'number') {
        continue;
      }
      const key = String(id);
      const record =
        players.get(key) ??
        {
          id,
          region,
          name: entry?.character?.name ?? 'Unknown',
          realmSlug:
            entry?.character?.realm?.slug ??
            slugify(entry?.character?.realm?.name),
          realmName:
            entry?.character?.realm?.name ??
            entry?.character?.realm?.slug ??
            '',
          ratings: {
            '2v2': null,
            '3v3': null,
            '5v5': null,
            rbg: null,
          },
          ranks: {
            '2v2': null,
            '3v3': null,
            '5v5': null,
            rbg: null,
          },
        };
      record.ratings[bracket] = entry?.rating ?? null;
      record.ranks[bracket] = entry?.rank ?? null;
      players.set(key, record);
    }
  }
  return players;
};

const formatDetailsKey = (race, className, spec) =>
  [race, className, spec]
    .filter(Boolean)
    .map(value => String(value).replace(/\s+/g, ''))
    .join('');

const fetchSummariesInBatches = async (region, players, token, options = {}) => {
  const {
    batchSize = 16,
    timeoutMs = 1500,
    limit = Infinity,
    classLimits,
  } = options;

  const cache = new Map();
  const completed = new Map(CLASS_META.map(meta => [meta.slug, 0]));
  const results = [];
  const playerList = [...players];

  let index = 0;
  while (index < playerList.length) {
    const batch = playerList.slice(index, index + batchSize);
    index += batchSize;

    const tasks = batch.map(async player => {
      const cacheKey = `${player.region}:${player.realmSlug}:${player.name}`.toLowerCase();
      if (cache.has(cacheKey)) {
        return { player, summary: cache.get(cacheKey) };
      }
      try {
        const summary = await fetchCharacterSummary(
          region,
          player.realmSlug,
          player.name,
          token,
          timeoutMs
        );
        cache.set(cacheKey, summary);
        return { player, summary };
      } catch (err) {
        cache.set(cacheKey, null);
        return { player, summary: null };
      }
    });

    const batchResults = await Promise.all(tasks);
    for (const { player, summary } of batchResults) {
      if (!summary) {
        continue;
      }
      const classId = summary?.character_class?.id;
      const classMeta = CLASS_INDEX.get(classId);
      if (!classMeta) {
        continue;
      }

      const currentCount = completed.get(classMeta.slug) ?? 0;
      const required = classLimits?.get(classMeta.slug) ?? limit;
      if (currentCount >= required || currentCount >= limit) {
        continue;
      }

      completed.set(classMeta.slug, currentCount + 1);
      results.push({
        player,
        classMeta,
        summary,
      });
    }

    const satisfied = Array.from(completed.entries()).every(([slug, count]) => {
      const required = classLimits?.get(slug) ?? limit;
      return count >= required;
    });
    if (satisfied) {
      break;
    }
  }

  return results;
};

const buildRegionDataset = async (region, token, limitPerClass = 50) => {
  const upperRegion = region.toUpperCase();
  const seasonId = await resolveSeasonId(region, token);
  const leaderboards = new Map();

  for (const bracket of BRACKETS) {
    const entries = await fetchLeaderboard(region, seasonId, bracket, token);
    leaderboards.set(bracket, entries);
  }

  const playerRecords = buildPlayerRecords(leaderboards, upperRegion);
  const sortedPlayers = [...playerRecords.values()].sort(
    (a, b) => (b.ratings['3v3'] ?? 0) - (a.ratings['3v3'] ?? 0)
  );

  const classLimits = new Map(CLASS_META.map(meta => [meta.slug, limitPerClass]));
  const enriched = await fetchSummariesInBatches(
    region,
    sortedPlayers,
    token,
    {
      limit: limitPerClass,
      classLimits,
    }
  );

  const buckets = new Map(CLASS_META.map(meta => [meta.slug, []]));

  for (const { player, classMeta, summary } of enriched) {
    const race =
      summary?.race?.name?.en_GB ??
      summary?.race?.name ??
      '';
    const spec =
      summary?.active_spec?.name ??
      '';
    const faction =
      summary?.faction?.name?.en_GB ??
      summary?.faction?.name ??
      summary?.faction?.type ??
      '';

    const bucket = buckets.get(classMeta.slug);
    if (!bucket) {
      continue;
    }

    bucket.push({
      id: player.id,
      rank: bucket.length + 1,
      region: upperRegion,
      classId: classMeta.id,
      className: classMeta.name,
      classSlug: classMeta.slug,
      spec,
      race,
      faction,
      detailsKey: formatDetailsKey(race, classMeta.name, spec),
      name: summary?.name ?? player.name,
      routeName: summary?.name ?? player.name,
      realm: summary?.realm?.name?.en_GB ??
        summary?.realm?.name ??
        player.realmName,
      realmSlug: player.realmSlug,
      ratings: player.ratings,
      ranks: player.ranks,
    });
  }

  return {
    seasonId,
    generatedAt: new Date().toISOString(),
    classes: Object.fromEntries(
      CLASS_META.map(meta => [
        meta.slug,
        (buckets.get(meta.slug) ?? []).slice(0, limitPerClass),
      ])
    ),
  };
};

const buildBisTopSnapshot = async ({
  regions = TRACKER_REGIONS,
  limitPerClass = 50,
} = {}) => {
  const tokenInfo = await getAccessToken();
  const result = {
    generatedAt: new Date().toISOString(),
    regions: {},
  };

  for (const region of regions) {
    try {
      const dataset = await buildRegionDataset(region, tokenInfo.token, limitPerClass);
      result.regions[region] = dataset;
    } catch (err) {
      console.error(`Failed to build dataset for region ${region}`, err.message);
    }
  }

  writeJson(result);
  return result;
};

module.exports = {
  BRACKETS,
  CLASS_META,
  CLASS_INDEX,
  CLASS_SLUG_INDEX,
  OUTPUT_PATH,
  buildBisTopSnapshot,
};
