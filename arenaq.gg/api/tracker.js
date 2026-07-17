const { TRACKER_REGIONS, getCachedTrackerSnapshot } = require('../tracker-snapshot');
const { handleCors } = require('./_lib/cors.cjs');

// Serverless functions have no persistent local disk between invocations, so
// this reads the snapshot refreshed on a schedule by
// .github/workflows/tracker-cron.yml instead of fetching + writing live.
module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  const regionParam = String(req.query.region ?? 'eu').toLowerCase();
  if (!TRACKER_REGIONS.includes(regionParam)) {
    res.status(400).json({ error: 'Unsupported region' });
    return;
  }

  try {
    const cached = getCachedTrackerSnapshot(regionParam);
    if (!cached) {
      res.status(404).json({ error: 'Tracker snapshot unavailable' });
      return;
    }
    res.status(200).json(cached);
  } catch (error) {
    console.error('Tracker endpoint failure', error?.message);
    res.status(500).json({ error: 'Failed to read tracker snapshot' });
  }
};
