const { TRACKER_REGIONS } = require('../../../../tracker-snapshot');
const { CHARACTER_RESOURCE_SUFFIX, fetchCharacterResource } = require('../../../../lib/character-api.cjs');
const { handleCors } = require('../../../_lib/cors.cjs');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  const region = String(req.query.region ?? '').toLowerCase();
  const realm = req.query.realm;
  const name = req.query.name;
  const resource = String(req.query.resource ?? '').toLowerCase();

  if (!TRACKER_REGIONS.includes(region)) {
    res.status(400).json({ error: 'Unsupported region' });
    return;
  }
  if (!CHARACTER_RESOURCE_SUFFIX[resource]) {
    res.status(400).json({ error: 'Unsupported resource' });
    return;
  }

  try {
    const data = await fetchCharacterResource(region, realm, name, resource);
    res.status(200).json(data);
  } catch (error) {
    const status = error?.response?.status ?? 500;
    if (status === 404) {
      res.status(404).json({ error: 'Character not found' });
      return;
    }
    console.error('Character resource fetch failed', error?.response?.data || error.message);
    res.status(status).json({ error: 'Failed to fetch character resource' });
  }
};
