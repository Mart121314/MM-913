const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const TRACKER_DATA_DIR = path.join(__dirname, 'data');
const TRACKER_DATA_PATH = path.join(TRACKER_DATA_DIR, 'tracker-history.json');
const TRACKER_REGIONS = ['eu', 'us'];
const TRACKER_BRACKETS = ['2v2', '3v3', '5v5'];
const TRACKER_RETENTION_HOURS = 48;
const SNAPSHOT_MIN_INTERVAL_MINUTES = 60;
const MAX_SNAPSHOT_ENTRIES = 600;

// CORS for Angular frontend (reflect requesting origin for dev/prod)
const corsOptions = { origin: true };
app.use(cors(corsOptions));

// Serve Angular static files (built with `ng build --configuration production`)
const angularDistPath = path.join(__dirname, 'dist/arenaq.gg');
app.use(express.static(angularDistPath));

// ------------------------------------------------------------------------------------
// Helper utilities
// ------------------------------------------------------------------------------------
const ensureDataDir = () => {
  if (!fs.existsSync(TRACKER_DATA_DIR)) {
    fs.mkdirSync(TRACKER_DATA_DIR, { recursive: true });
  }
};

const readTrackerStore = () => {
  try {
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

const writeTrackerStore = store => {
  try {
    ensureDataDir();
    fs.writeFileSync(TRACKER_DATA_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist tracker store', err);
  }
};

let tokenCache = {
  value: null,
  expiresAt: 0,
  ttlSeconds: 0,
};

const seasonCache = new Map(); // region -> { id, fetchedAt }

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
  const cacheRecord = seasonCache.get(region);
  if (cacheRecord && Date.now() - cacheRecord.fetchedAt < 60 * 60 * 1000) {
    return cacheRecord.id;
  }

  const namespace = `dynamic-classic-${region}`;
  const url = `https://${region}.api.blizzard.com/data/wow/pvp-season/index?namespace=${namespace}&locale=en_GB`;
  const { data } = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const currentSeasonId = data?.current_season?.id;
  const fallbackId = Array.isArray(data?.seasons)
    ? data.seasons.reduce((max, item) => {
        const id = item?.id ?? 0;
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
      const prevEntry = previous.entries[id];
      if (!prevEntry) {
        return;
      }

      const rankChange = (prevEntry.rank ?? 0) - (currentEntry.rank ?? 0);
      const ratingChange = (currentEntry.rating ?? 0) - (prevEntry.rating ?? 0);
      const winsChange = (currentEntry.wins ?? 0) - (prevEntry.wins ?? 0);
      const lossesChange = (currentEntry.losses ?? 0) - (prevEntry.losses ?? 0);

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

// ------------------------------------------------------------------------------------
// API routes
// ------------------------------------------------------------------------------------

app.get('/api/token', async (req, res) => {
  try {
    const { token, expiresIn } = await getAccessToken();
    res.json({ access_token: token, expires_in: expiresIn });
  } catch (error) {
    console.error('Token fetch failed:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to retrieve token' });
  }
});

app.get('/api/tracker', async (req, res) => {
  const regionParam = String(req.query.region ?? 'eu').toLowerCase();
  if (!TRACKER_REGIONS.includes(regionParam)) {
    return res.status(400).json({ error: 'Unsupported region' });
  }

  try {
    const now = new Date();
    const store = readTrackerStore();
    const regionStore = (store[regionParam] ||= {});

    const { token } = await getAccessToken();
    const seasonId = await fetchClassicSeasonId(regionParam, token);

    const bracketResults = [];

    for (const bracket of TRACKER_BRACKETS) {
      const leaderboard = await fetchLeaderboardEntries(regionParam, bracket, seasonId, token);
      const limited = leaderboard.slice(0, MAX_SNAPSHOT_ENTRIES);
      const snapshotEntries = buildSnapshotEntries(limited);
      const newSnapshot = {
        timestamp: now.toISOString(),
        entries: snapshotEntries,
      };

      const bracketStore = (regionStore[bracket] ||= { snapshots: [] });
      const snapshots = bracketStore.snapshots;
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
      bracketResults.push(events);
    }

    writeTrackerStore(store);

    const combinedEvents = bracketResults
      .flat()
      .sort((a, b) => new Date(b.trackedAt).getTime() - new Date(a.trackedAt).getTime())
      .slice(0, 1500);

    res.json({
      region: regionParam,
      generatedAt: now.toISOString(),
      events: combinedEvents,
    });
  } catch (error) {
    console.error('Tracker endpoint failure', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to build tracker snapshot' });
  }
});

// ------------------------------------------------------------------------------------
// Fallback route to Angular's index.html for SPA support
// ------------------------------------------------------------------------------------
const indexPath = path.join(angularDistPath, 'index.html');
app.get(/.*/, (req, res) => {
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res
      .status(500)
      .send('index.html not found - did you run `ng build` and commit the output?');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
