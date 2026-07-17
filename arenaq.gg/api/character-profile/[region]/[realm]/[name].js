const { TRACKER_REGIONS } = require('../../../tracker-snapshot');
const { fetchCharacterProfileBundle } = require('../../../lib/character-api.cjs');
const { handleCors } = require('../../_lib/cors.cjs');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  const region = String(req.query.region ?? '').toLowerCase();
  const realm = req.query.realm;
  const name = req.query.name;

  if (!TRACKER_REGIONS.includes(region)) {
    res.status(400).json({ error: 'Unsupported region' });
    return;
  }

  try {
    const bundle = await fetchCharacterProfileBundle(region, realm, name);
    res.status(200).json(bundle);
  } catch (error) {
    const status = error?.response?.status ?? 500;
    if (status === 404) {
      res.status(404).json({ error: 'Character not found' });
      return;
    }
    console.error('Character profile fetch failed', error?.response?.data || error.message);
    res.status(status).json({ error: 'Failed to fetch character profile' });
  }
};
