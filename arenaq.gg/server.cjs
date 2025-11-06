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
const browserDistFolder = join(import.meta.dirname, '../dist/arenaq.gg/browser');
const app = express();
const PORT = process.env.PORT || 3000;

// CORS for Angular frontend (reflect requesting origin for dev/prod)
const corsOptions = { origin: true };
app.use(cors(corsOptions));

app.use(express.static(angularDistPath));

app.get('*', (req, res) => res.sendFile(indexPath));
// Serve Angular static files (built with `ng build --configuration production`)
const angularDistPath = path.join(__dirname, 'dist/arenaq.gg');
app.use(express.static(angularDistPath));

// API route for Blizzard OAuth token
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
    const response = await updateTrackerForRegion(regionParam);
    res.json(response);
  } catch (error) {
    const status = error?.response?.status ?? error?.status ?? 500;
    if (status === 429) {
      console.warn('Tracker API rate limited; serving cached snapshot.');
      const cached = getCachedTrackerSnapshot(regionParam);
      if (cached) {
        return res.json({ ...cached, rateLimited: true });
      }
    }
    console.error('Tracker endpoint failure', error?.response?.data || error.message);
    res
      .status(status)
      .json({
        error: 'Failed to build tracker snapshot',
        rateLimited: status === 429,
      });
  }
});

app.get('/api/bis-top', (req, res) => {
  try {
    if (!fs.existsSync(BIS_TOP_PATH)) {
      return res.status(404).json({ error: 'BiS snapshot unavailable' });
    }
    const raw = fs.readFileSync(BIS_TOP_PATH, 'utf-8');
    res.setHeader('Content-Type', 'application/json');
    res.send(raw);
  } catch (error) {
    console.error('Failed to serve BiS snapshot', error);
    res.status(500).json({ error: 'Failed to read BiS snapshot' });
  }
});

app.get('/api/leaderboard', (req, res) => {
  const region = String(req.query.region ?? 'eu').toLowerCase();
  const bracket = String(req.query.bracket ?? '3v3').toLowerCase();
  const page = Number(req.query.page ?? 1);
  const pageSize = Number(req.query.pageSize ?? 100);

  if (!TRACKER_REGIONS.includes(region)) {
    return res.status(400).json({ error: 'Unsupported region' });
  }

  try {
    if (!fs.existsSync(LEADERBOARD_PATH)) {
      return res.status(404).json({ error: 'Leaderboard snapshot unavailable' });
    }

    const raw = fs.readFileSync(LEADERBOARD_PATH, 'utf-8');
    const snapshot = JSON.parse(raw);
    const regionData = snapshot?.regions?.[region];
    const bracketData = regionData?.brackets?.[bracket];

    if (!bracketData) {
      return res.status(404).json({ error: 'Leaderboard data missing' });
    }

    const safePageSize = Math.max(1, Math.min(500, Math.floor(pageSize)));
    const totalEntries = bracketData.totalEntries ?? bracketData.entries.length;
    const totalPages = Math.max(1, Math.ceil(totalEntries / safePageSize));
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const start = (safePage - 1) * safePageSize;
    const entries = bracketData.entries.slice(start, start + safePageSize);

    res.json({
      region: region.toUpperCase(),
      bracket,
      page: safePage,
      pageSize: safePageSize,
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

// Fallback route to Angular's index.html for SPA support
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
