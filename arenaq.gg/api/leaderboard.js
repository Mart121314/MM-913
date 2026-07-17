const fs = require('fs');
const { TRACKER_REGIONS } = require('../tracker-snapshot');
const { OUTPUT_PATH: LEADERBOARD_PATH } = require('../leaderboard-snapshot');
const { decorateLeaderboardEntry } = require('../lib/character-api.cjs');
const { handleCors } = require('./_lib/cors.cjs');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  const region = String(req.query.region ?? 'eu').toLowerCase();
  const bracket = String(req.query.bracket ?? '3v3').toLowerCase();
  const page = Number(req.query.page ?? 1);
  const pageSize = Math.max(1, Math.min(500, Math.floor(Number(req.query.pageSize ?? 100))));

  if (!TRACKER_REGIONS.includes(region)) {
    res.status(400).json({ error: 'Unsupported region' });
    return;
  }

  try {
    if (!fs.existsSync(LEADERBOARD_PATH)) {
      res.status(404).json({ error: 'Leaderboard snapshot unavailable' });
      return;
    }

    const snapshot = JSON.parse(fs.readFileSync(LEADERBOARD_PATH, 'utf-8'));
    const regionData = snapshot?.regions?.[region];
    const bracketData = regionData?.brackets?.[bracket];

    if (!bracketData) {
      res.status(404).json({ error: 'Leaderboard data missing' });
      return;
    }

    const totalEntries = bracketData.totalEntries ?? bracketData.entries.length;
    const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const start = (safePage - 1) * pageSize;
    const entries = bracketData.entries.slice(start, start + pageSize);
    const enrichedEntries = entries.map(entry => decorateLeaderboardEntry(entry, region));

    res.status(200).json({
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
};
