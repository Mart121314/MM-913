// server.cjs  (CommonJS)
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

// CORS
app.use(cors({ origin: true }));

// Serve Angular browser bundle
const angularDistPath = path.join(__dirname, 'dist', 'arenaq.gg', 'browser');
app.use(express.static(angularDistPath));
const indexPath = path.join(angularDistPath, 'index.html');

// ---------------- API ROUTES ----------------
app.get('/api/token', async (_req, res) => {
  try {
    const { token, expiresIn } = await getAccessToken();
    res.json({ access_token: token, expires_in: expiresIn });
  } catch (e) {
    console.error('Token fetch failed:', e?.response?.data || e.message);
    res.status(500).json({ error: 'Failed to retrieve token' });
  }
});

app.get('/api/tracker', async (req, res) => {
  const regionParam = String(req.query.region ?? 'eu').toLowerCase();
  if (!TRACKER_REGIONS.includes(regionParam)) {
    return res.status(400).json({ error: 'Unsupported region' });
  }
  try {
    const response = await updateTrackerForRegion(regionParam);
    res.json(response);
  } catch (e) {
    const status = e?.response?.status ?? e?.status ?? 500;
    if (status === 429) {
      const cached = getCachedTrackerSnapshot(regionParam);
      if (cached) return res.json({ ...cached, rateLimited: true });
    }
    res.status(status).json({ error: 'Failed to build tracker snapshot', rateLimited: status === 429 });
  }
});

app.get('/api/bis-top', (_req, res) => {
  try {
    if (!fs.existsSync(BIS_TOP_PATH)) return res.status(404).json({ error: 'BiS snapshot unavailable' });
    res.type('application/json').send(fs.readFileSync(BIS_TOP_PATH, 'utf-8'));
  } catch (e) {
    res.status(500).json({ error: 'Failed to read BiS snapshot' });
  }
});

app.get('/api/leaderboard', (req, res) => {
  const region = String(req.query.region ?? 'eu').toLowerCase();
  const bracket = String(req.query.bracket ?? '3v3').toLowerCase();
  const page = Number(req.query.page ?? 1);
  const pageSize = Math.max(1, Math.min(500, Math.floor(Number(req.query.pageSize ?? 100))));
  if (!TRACKER_REGIONS.includes(region)) return res.status(400).json({ error: 'Unsupported region' });

  try {
    if (!fs.existsSync(LEADERBOARD_PATH)) return res.status(404).json({ error: 'Leaderboard snapshot unavailable' });
    const snapshot = JSON.parse(fs.readFileSync(LEADERBOARD_PATH, 'utf-8'));
    const regionData = snapshot?.regions?.[region];
    const bracketData = regionData?.brackets?.[bracket];
    if (!bracketData) return res.status(404).json({ error: 'Leaderboard data missing' });

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
  } catch (e) {
    res.status(500).json({ error: 'Failed to read leaderboard snapshot' });
  }
});
// -------------- END API ROUTES --------------

// ✅ Express 5–safe SPA fallback (must be after API routes)
app.get('/*', (_req, res) => res.sendFile(indexPath));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
