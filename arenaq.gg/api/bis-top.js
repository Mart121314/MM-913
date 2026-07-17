const fs = require('fs');
const { OUTPUT_PATH: BIS_TOP_PATH } = require('../bis-top-snapshot');
const { handleCors } = require('./_lib/cors.cjs');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  try {
    if (!fs.existsSync(BIS_TOP_PATH)) {
      res.status(404).json({ error: 'BiS snapshot unavailable' });
      return;
    }
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(fs.readFileSync(BIS_TOP_PATH, 'utf-8'));
  } catch (error) {
    console.error('Failed to serve BiS snapshot', error);
    res.status(500).json({ error: 'Failed to read BiS snapshot' });
  }
};
