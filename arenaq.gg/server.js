const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ CORS for local dev
app.use(cors({ origin: 'http://localhost:4200' }));

// ✅ Serve Angular static files
app.use(express.static(path.join(__dirname, 'dist/arenaq')));

// ✅ API route
app.get('/api/token', async (req, res) => {
  try {
    const response = await axios.post(
      'https://us.battle.net/oauth/token',
      'grant_type=client_credentials',
      {
        headers: {
          Authorization:
            'Basic ' +
            Buffer.from(`${process.env.BLIZZARD_CLIENT_ID}:${process.env.BLIZZARD_CLIENT_SECRET}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Token fetch failed:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to retrieve token' });
  }
});

// ✅ Fallback: Angular index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/arenaq/index.html'));
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
