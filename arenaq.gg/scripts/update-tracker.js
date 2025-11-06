#!/usr/bin/env node
/* eslint-disable no-console */

const {
  TRACKER_REGIONS,
  updateAllRegions,
} = require('../tracker-snapshot');

const run = async () => {
  try {
    const results = await updateAllRegions(TRACKER_REGIONS);
    results.forEach(result => {
      console.log(
        `[tracker] ${result.region.toUpperCase()} · ${result.events.length} events · snapshot ${result.generatedAt}`
      );
    });
    console.log('Tracker snapshots updated successfully.');
  } catch (error) {
    console.error('Failed to update tracker snapshots', error);
    process.exitCode = 1;
  }
};

run();

