const { getAccessToken } = require('../tracker-snapshot');
const { handleCors } = require('./_lib/cors.cjs');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  try {
    const { token, expiresIn } = await getAccessToken();
    res.status(200).json({ access_token: token, expires_in: expiresIn });
  } catch (error) {
    console.error('Token fetch failed:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to retrieve token' });
  }
};
