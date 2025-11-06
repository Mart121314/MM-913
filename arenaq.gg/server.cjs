// server.cjs  — CommonJS, Express 5–safe, CSR build
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
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

    res.json({
      region: region.toUpperCase(),
      bracket,
      page: safePage,
      pageSize,
      totalEntries,
      totalPages,
      seasonId: regionData.seasonId,
      generatedAt: bracketData.generatedAt ?? snapshot.generatedAt,
      entries,
      cutoffs: bracketData.cutoffs ?? null,
      cached: true,
    });
  } catch (error) {
    console.error('Failed to serve leaderboard snapshot', error);
    res.status(500).json({ error: 'Failed to read leaderboard snapshot' });
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
