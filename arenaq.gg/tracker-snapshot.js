const dotenv = require('dotenv');
dotenv.config();

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const TRACKER_DATA_DIR = path.join(__dirname, 'data');
const TRACKER_DATA_PATH = path.join(TRACKER_DATA_DIR, 'tracker-history.json');
const TRACKER_REGIONS = ['eu', 'us'];
const TRACKER_BRACKETS = ['2v2', '3v3', '5v5'];
const TRACKER_RETENTION_HOURS = 48;
const SNAPSHOT_MIN_INTERVAL_MINUTES = 60;
const MAX_SNAPSHOT_ENTRIES = 600;

let tokenCache = {
  value: null,
  expiresAt: 0,
  ttlSeconds: 0,
};

const seasonCache = new Map(); // region -> { id, fetchedAt }

const ensureDataDir = () => {
  if (!fs.existsSync(TRACKER_DATA_DIR)) {
    fs.mkdirSync(TRACKER_DATA_DIR, { recursive: true });
  }
};

const loadStore = () => {
  try {
    ensureDataDir();
    if (!fs.existsSync(TRACKER_DATA_PATH)) {
      return {};
    }
    const raw = fs.readFileSync(TRACKER_DATA_PATH, 'utf-8');
    return JSON.parse(raw) || {};
  } catch (err) {
    console.error('Failed to read tracker store', err);
    return {};
  }
};

const saveStore = store => {
  try {
    ensureDataDir();
    fs.writeFileSync(TRACKER_DATA_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist tracker store', err);
  }
};

const getAccessToken = async () => {
  const now = Date.now();
  if (tokenCache.value && now < tokenCache.expiresAt) {
    return {
      token: tokenCache.value,
      expiresIn: Math.max(0, Math.floor((tokenCache.expiresAt - now) / 1000)),
    };
  }

  const clientId = process.env.BLIZZARD_CLIENT_ID;
  const clientSecret = process.env.BLIZZARD_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Blizzard API credentials are not configured');
  }

  const response = await axios.post(
    'https://us.battle.net/oauth/token',
    'grant_type=client_credentials',
    {
      headers: {
        Authorization:
          'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  const { access_token: token, expires_in: expiresIn } = response.data;
  tokenCache = {
    value: token,
    expiresAt: now + Math.max(0, (expiresIn - 60) * 1000),
    ttlSeconds: expiresIn,
  };
  return { token, expiresIn };
};

const fetchClassicSeasonId = async (region, token) => {
  const cached = seasonCache.get(region);
  if (cached && Date.now() - cached.fetchedAt < 60 * 60 * 1000) {
    return cached.id;
  }

  const namespace = `dynamic-classic-${region}`;
  const url = `https://${region}.api.blizzard.com/data/wow/pvp-season/index?namespace=${namespace}&locale=en_GB`;
  const { data } = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const currentSeasonId = data?.current_season?.id;
  const fallbackId = Array.isArray(data?.seasons)
    ? data.seasons.reduce((max, season) => {
        const id = season?.id ?? 0;
        return id > max ? id : max;
      }, 0)
    : 0;

  const seasonId = currentSeasonId || fallbackId;
  if (!seasonId) {
    throw new Error('Unable to determine Classic season id');
  }

  seasonCache.set(region, { id: seasonId, fetchedAt: Date.now() });
  return seasonId;
};

const fetchLeaderboardEntries = async (region, bracket, seasonId, token) => {
  const namespace = `dynamic-classic-${region}`;
  const url = `https://${region}.api.blizzard.com/data/wow/pvp-season/${seasonId}/pvp-leaderboard/${bracket}?namespace=${namespace}&locale=en_GB`;
  const { data } = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return Array.isArray(data?.entries) ? data.entries : [];
};

const buildSnapshotEntries = entries => {
  const snapshot = {};
  for (const entry of entries) {
    const characterId = entry?.character?.id;
    if (typeof characterId !== 'number') {
      continue;
    }

    const slug =
      entry?.character?.realm?.slug ??
      entry?.character?.realm?.name ??
      entry?.character?.realm ??
      '';

    snapshot[String(characterId)] = {
      rank: Number(entry?.rank ?? 0) || 0,
      rating: Number(entry?.rating ?? 0) || 0,
      wins: Number(entry?.season_match_statistics?.won ?? 0) || 0,
      losses: Number(entry?.season_match_statistics?.lost ?? 0) || 0,
      name: entry?.character?.name ?? 'Unknown',
      realm: slug,
      race:
        entry?.character?.playable_race?.name?.en_GB ??
        entry?.character?.playable_race?.name ??
        'Unknown',
      className:
        entry?.character?.playable_class?.name?.en_GB ??
        entry?.character?.playable_class?.name ??
        'Unknown',
      spec:
        entry?.character?.spec?.name?.en_GB ??
        entry?.character?.spec?.name ??
        '',
    };
  }
  return snapshot;
};

const trimSnapshots = (snapshots, now) => {
  const retentionMs = TRACKER_RETENTION_HOURS * 60 * 60 * 1000;
  return snapshots.filter(snapshot => {
    const ts = new Date(snapshot.timestamp).getTime();
    return Number.isFinite(ts) && now - ts <= retentionMs;
  });
};

const computeEventsForSnapshots = (bracket, snapshots) => {
  const events = [];
  for (let i = 1; i < snapshots.length; i += 1) {
    const previous = snapshots[i - 1];
    const current = snapshots[i];
    const trackedAt = current.timestamp;

    Object.entries(current.entries).forEach(([id, currentEntry]) => {
      const previousEntry = previous.entries[id];
      if (!previousEntry) {
        return;
      }

      const rankChange = (previousEntry.rank ?? 0) - (currentEntry.rank ?? 0);
      const ratingChange = (currentEntry.rating ?? 0) - (previousEntry.rating ?? 0);
      const winsChange = (currentEntry.wins ?? 0) - (previousEntry.wins ?? 0);
      const lossesChange = (currentEntry.losses ?? 0) - (previousEntry.losses ?? 0);

      if (
        rankChange === 0 &&
        ratingChange === 0 &&
        winsChange === 0 &&
        lossesChange === 0
      ) {
        return;
      }

      events.push({
        id: `${bracket}:${id}:${trackedAt}`,
        bracket,
        characterId: Number(id),
        name: currentEntry.name || 'Unknown',
        realm: currentEntry.realm || 'unknown',
        race: currentEntry.race || 'Unknown',
        className: currentEntry.className || 'Unknown',
        spec: currentEntry.spec || '',
        rank: currentEntry.rank ?? null,
        rankChange,
        rating: currentEntry.rating ?? null,
        ratingChange,
        wins: currentEntry.wins ?? null,
        winsChange,
        losses: currentEntry.losses ?? null,
        lossesChange,
        trackedAt,
      });
    });
  }
  return events;
};

const updateTrackerForRegion = async (region, existingTokenInfo) => {
  if (!TRACKER_REGIONS.includes(region)) {
    throw new Error(`Unsupported region "${region}"`);
  }

  const now = new Date();
  const store = loadStore();
  const regionStore = store[region] || {};

  const tokenInfo = existingTokenInfo || (await getAccessToken());
  const token = tokenInfo.token;

  const seasonId = await fetchClassicSeasonId(region, token);
  const bracketEvents = [];

  for (const bracket of TRACKER_BRACKETS) {
    const leaderboard = await fetchLeaderboardEntries(region, bracket, seasonId, token);
    const limited = leaderboard.slice(0, MAX_SNAPSHOT_ENTRIES);
    const snapshotEntries = buildSnapshotEntries(limited);
    const newSnapshot = {
      timestamp: now.toISOString(),
      entries: snapshotEntries,
    };

    const bracketStore = regionStore[bracket] || { snapshots: [] };
    const snapshots = bracketStore.snapshots || [];
    const lastSnapshot = snapshots[snapshots.length - 1];
    const lastTimestamp = lastSnapshot ? new Date(lastSnapshot.timestamp).getTime() : 0;
    const shouldReplace =
      lastSnapshot &&
      Number.isFinite(lastTimestamp) &&
      now.getTime() - lastTimestamp < SNAPSHOT_MIN_INTERVAL_MINUTES * 60 * 1000;

    if (shouldReplace) {
      snapshots[snapshots.length - 1] = newSnapshot;
    } else {
      snapshots.push(newSnapshot);
    }

    bracketStore.snapshots = trimSnapshots(snapshots, now.getTime());
    regionStore[bracket] = bracketStore;

    const events = computeEventsForSnapshots(bracket, bracketStore.snapshots);
    bracketEvents.push(events);
  }

  store[region] = regionStore;
  saveStore(store);

  const combinedEvents = bracketEvents
    .flat()
    .sort((a, b) => new Date(b.trackedAt).getTime() - new Date(a.trackedAt).getTime())
    .slice(0, 1500);

  return {
    region,
    generatedAt: now.toISOString(),
    events: combinedEvents,
  };
};

const updateAllRegions = async regions => {
  const tokenInfo = await getAccessToken();
  const outputs = [];
  for (const region of regions || TRACKER_REGIONS) {
    outputs.push(await updateTrackerForRegion(region, tokenInfo));
  }
  return outputs;
};

const getCachedTrackerSnapshot = region => {
  const store = loadStore();
  const regionStore = store?.[region];
  if (!regionStore) {
    return null;
  }

  const bracketEvents = [];

  for (const bracket of TRACKER_BRACKETS) {
    const bracketStore = regionStore[bracket];
    if (!bracketStore?.snapshots?.length) {
      continue;
    }
    const events = computeEventsForSnapshots(bracket, bracketStore.snapshots);
    bracketEvents.push(events);
  }

  if (!bracketEvents.length) {
    return null;
  }

  const combinedEvents = bracketEvents
    .flat()
    .sort((a, b) => new Date(b.trackedAt).getTime() - new Date(a.trackedAt).getTime())
    .slice(0, 1500);

  return {
    region,
    generatedAt: new Date().toISOString(),
    events: combinedEvents,
    cached: true,
  };
};

module.exports = {
  TRACKER_DATA_DIR,
  TRACKER_DATA_PATH,
  TRACKER_REGIONS,
  TRACKER_BRACKETS,
  getAccessToken,
  updateTrackerForRegion,
  updateAllRegions,
  loadStore,
  saveStore,
  getCachedTrackerSnapshot,
};
