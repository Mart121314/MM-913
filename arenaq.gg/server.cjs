// server.cjs  — CommonJS, Express 5–safe, CSR build
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

const {
  TRACKER_REGIONS,
  getAccessToken,
  updateTrackerForRegion,
  getCachedTrackerSnapshot,
} = require('./tracker-snapshot');

const { OUTPUT_PATH: BIS_TOP_PATH } = require('./bis-top-snapshot');
const { OUTPUT_PATH: LEADERBOARD_PATH } = require('./leaderboard-snapshot');

const app = express();
const PORT = process.env.PORT || 3000;

// --- CORS (reflect origin) ---
app.use(cors({ origin: true }));

// --- Serve Angular browser bundle (CSR) ---
const angularDistPath = path.join(__dirname, 'dist', 'arenaq.gg', 'browser');
const indexPath = path.join(angularDistPath, 'index.html');

const CHARACTER_RESOURCE_SUFFIX = {
  summary: '',
  equipment: '/equipment',
  specializations: '/specializations',
  media: '/character-media',
};

const RACE_NAME_TO_ID = {
  human: 1,
  orc: 2,
  dwarf: 3,
  'night-elf': 4,
  nightelf: 4,
  undead: 5,
  forsaken: 5,
  tauren: 6,
  gnome: 7,
  troll: 8,
  goblin: 9,
  'blood-elf': 10,
  bloodelf: 10,
  draenei: 11,
  'worgen': 22,
  pandaren: 24,
  'pandaren-alliance': 25,
  'pandaren-horde': 26,
  'nightborne': 27,
  'highmountain-tauren': 28,
  'void-elf': 29,
  'lightforged-draenei': 30,
  'zandalari-troll': 31,
  'kul-tiran': 32,
  'dark-iron-dwarf': 34,
  'vulpera': 35,
  'maghar-orc': 36,
  mechagnome: 37,
  dracthyr: 70,
};

const slugify = value =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const encodeSlug = value => encodeURIComponent(String(value ?? '').toLowerCase());

const buildRaceIconUrl = (raceId, region) => {
  if (!Number.isFinite(raceId)) {
    return null;
  }
  const shard = String(region ?? '')
    .toLowerCase()
    .startsWith('us')
    ? 'us'
    : 'eu';
  return `https://render.worldofwarcraft.com/classic-${shard}/race/${raceId}-0.jpg`;
};

const raceNameToId = raceName => {
  const slug = slugify(raceName);
  return RACE_NAME_TO_ID[slug] ?? null;
};

const decorateLeaderboardEntry = (entry, region) => {
  if (!entry || typeof entry !== 'object') {
    return entry;
  }
  const normalizedRegion = String(entry.region ?? region ?? 'eu').toLowerCase();
  const raceId =
    typeof entry.raceId === 'number' && Number.isFinite(entry.raceId)
      ? entry.raceId
      : raceNameToId(entry.race);
  const raceSlug = entry.raceSlug ?? (entry.race ? slugify(entry.race) : null);
  const raceIcon = entry.raceIcon ?? (raceId ? buildRaceIconUrl(raceId, normalizedRegion) : null);

  return {
    ...entry,
    raceId: raceId ?? null,
    raceSlug,
    raceIcon,
    region: entry.region ?? normalizedRegion.toUpperCase(),
  };
};

const fetchCharacterResource = async (region, realm, name, resourceKey) => {
  const suffix = CHARACTER_RESOURCE_SUFFIX[resourceKey];
  if (suffix == null) {
    throw new Error(`Unsupported resource "${resourceKey}"`);
  }
  const tokenInfo = await getAccessToken();
  const headers = { Authorization: `Bearer ${tokenInfo.token}` };
  const namespace = `profile-classic-${region}`;
  const realmSlug = encodeSlug(realm);
  const characterSlug = encodeSlug(name);
  const url = `https://${region}.api.blizzard.com/profile/wow/character/${realmSlug}/${characterSlug}${suffix}?namespace=${namespace}&locale=en_GB`;
  const { data } = await axios.get(url, { headers });
  return data;
};

const fetchCharacterProfileBundle = async (region, realm, name) => {
  const summary = await fetchCharacterResource(region, realm, name, 'summary');

  const [equipment, specializations, media] = await Promise.all([
    fetchCharacterResource(region, realm, name, 'equipment').catch(error => {
      console.warn('Equipment fetch failed', error?.response?.status || error?.message);
      return null;
    }),
    fetchCharacterResource(region, realm, name, 'specializations').catch(error => {
      console.warn('Specializations fetch failed', error?.response?.status || error?.message);
      return null;
    }),
    fetchCharacterResource(region, realm, name, 'media').catch(error => {
      console.warn('Media fetch failed', error?.response?.status || error?.message);
      return null;
    }),
  ]);

  return { summary, equipment, specializations, media };
};

// Static files first (cache static assets; never cache index.html)
app.use(
  express.static(angularDistPath, {
    maxAge: '1y',
    setHeaders: (res, file) => {
      if (file.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-store');
      }
    },
  }),
);

// ---------------- API ROUTES ----------------

// OAuth token
app.get('/api/token', async (_req, res) => {
  try {
    const { token, expiresIn } = await getAccessToken();
    res.json({ access_token: token, expires_in: expiresIn });
  } catch (error) {
    console.error('Token fetch failed:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to retrieve token' });
  }
});

// Tracker snapshot (by region)
app.get('/api/tracker', async (req, res) => {
  const regionParam = String(req.query.region ?? 'eu').toLowerCase();
  if (!TRACKER_REGIONS.includes(regionParam)) {
    return res.status(400).json({ error: 'Unsupported region' });
  }
  try {
    const response = await updateTrackerForRegion(regionParam);
    res.json(response);
  } catch (error) {
    const status = error?.response?.status ?? error?.status ?? 500;
    if (status === 429) {
      console.warn('Tracker API rate limited; serving cached snapshot.');
      const cached = getCachedTrackerSnapshot(regionParam);
      if (cached) return res.json({ ...cached, rateLimited: true });
    }
    console.error('Tracker endpoint failure', error?.response?.data || error.message);
    res.status(status).json({
      error: 'Failed to build tracker snapshot',
      rateLimited: status === 429,
    });
  }
});

// BiS snapshot
app.get('/api/bis-top', (_req, res) => {
  try {
    if (!fs.existsSync(BIS_TOP_PATH)) {
      return res.status(404).json({ error: 'BiS snapshot unavailable' });
    }
    res.type('application/json').send(fs.readFileSync(BIS_TOP_PATH, 'utf-8'));
  } catch (error) {
    console.error('Failed to serve BiS snapshot', error);
    res.status(500).json({ error: 'Failed to read BiS snapshot' });
  }
});

// Leaderboard snapshot (region/bracket/pagination)
app.get('/api/leaderboard', (req, res) => {
  const region = String(req.query.region ?? 'eu').toLowerCase();
  const bracket = String(req.query.bracket ?? '3v3').toLowerCase();
  const page = Number(req.query.page ?? 1);
  const pageSize = Math.max(1, Math.min(500, Math.floor(Number(req.query.pageSize ?? 100))));

  if (!TRACKER_REGIONS.includes(region)) {
    return res.status(400).json({ error: 'Unsupported region' });
  }

  try {
    if (!fs.existsSync(LEADERBOARD_PATH)) {
      return res.status(404).json({ error: 'Leaderboard snapshot unavailable' });
    }

    const snapshot = JSON.parse(fs.readFileSync(LEADERBOARD_PATH, 'utf-8'));
    const regionData = snapshot?.regions?.[region];
    const bracketData = regionData?.brackets?.[bracket];

    if (!bracketData) {
      return res.status(404).json({ error: 'Leaderboard data missing' });
    }

    const totalEntries = bracketData.totalEntries ?? bracketData.entries.length;
    const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const start = (safePage - 1) * pageSize;
    const entries = bracketData.entries.slice(start, start + pageSize);
    const enrichedEntries = entries.map(entry => decorateLeaderboardEntry(entry, region));

    res.json({
      region: region.toUpperCase(),
      bracket,
      page: safePage,
      pageSize,
      totalEntries,
      totalPages,
      seasonId: regionData.seasonId,
      generatedAt: bracketData.generatedAt ?? snapshot.generatedAt,
      entries: enrichedEntries,
      cutoffs: bracketData.cutoffs ?? null,
      cached: true,
    });
  } catch (error) {
    console.error('Failed to serve leaderboard snapshot', error);
    res.status(500).json({ error: 'Failed to read leaderboard snapshot' });
  }
});

app.get('/api/character/:region/:realm/:name/:resource', async (req, res) => {
  const region = String(req.params.region ?? '').toLowerCase();
  const realm = req.params.realm;
  const name = req.params.name;
  const resource = String(req.params.resource ?? '').toLowerCase();

  if (!TRACKER_REGIONS.includes(region)) {
    return res.status(400).json({ error: 'Unsupported region' });
  }
  if (!CHARACTER_RESOURCE_SUFFIX[resource]) {
    return res.status(400).json({ error: 'Unsupported resource' });
  }

  try {
    const data = await fetchCharacterResource(region, realm, name, resource);
    res.json(data);
  } catch (error) {
    const status = error?.response?.status ?? 500;
    if (status === 404) {
      return res.status(404).json({ error: 'Character not found' });
    }
    console.error('Character resource fetch failed', error?.response?.data || error.message);
    res.status(status).json({ error: 'Failed to fetch character resource' });
  }
});

app.get('/api/character-profile/:region/:realm/:name', async (req, res) => {
  const region = String(req.params.region ?? '').toLowerCase();
  const realm = req.params.realm;
  const name = req.params.name;

  if (!TRACKER_REGIONS.includes(region)) {
    return res.status(400).json({ error: 'Unsupported region' });
  }

  try {
    const bundle = await fetchCharacterProfileBundle(region, realm, name);
    res.json(bundle);
  } catch (error) {
    const status = error?.response?.status ?? 500;
    if (status === 404) {
      return res.status(404).json({ error: 'Character not found' });
    }
    console.error('Character profile fetch failed', error?.response?.data || error.message);
    res.status(status).json({ error: 'Failed to fetch character profile' });
  }
});
// -------------- END API ROUTES --------------

// ✅ Express 5–safe SPA fallback (NO wildcard pattern)
// Send index.html for any non-API GET that wasn’t matched above.
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(indexPath);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Serving', indexPath);
});
