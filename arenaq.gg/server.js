const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS for Angular frontend (reflect requesting origin for dev/prod)
const corsOptions = { origin: true };
app.use(cors(corsOptions));

// Serve Angular static files (built with `ng build --configuration production`)
const angularDistPath = path.join(__dirname, 'dist/arenaq.gg');
app.use(express.static(angularDistPath));

// API route for Blizzard OAuth token
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

// Fallback route to Angular's index.html for SPA support
const indexPath = path.join(angularDistPath, 'index.html');
app.get(/.*/, (req, res) => {
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(500).send('index.html not found - did you run `ng build` and commit the output?');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
