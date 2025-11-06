#!/usr/bin/env node
const path = require('path');
const { buildLeaderboardSnapshot, OUTPUT_PATH } = require('../leaderboard-snapshot');

async function run() {
  try {
    const snapshot = await buildLeaderboardSnapshot();
    console.log(
      `Leaderboard snapshot updated -> ${path.relative(process.cwd(), OUTPUT_PATH)}`
    );
    console.log(
      `Regions: ${Object.keys(snapshot.regions).join(', ')}`
    );
  } catch (err) {
    console.error('Failed to update leaderboard snapshot', err);
    process.exitCode = 1;
  }
}

run();

