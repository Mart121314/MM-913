#!/usr/bin/env node
const path = require('path');
const { buildBisTopSnapshot, OUTPUT_PATH } = require('../bis-top-snapshot');

async function run() {
  try {
    const result = await buildBisTopSnapshot();
    console.log(
      `BiS top snapshot updated: ${Object.keys(result.regions).join(', ')} -> ${path.relative(process.cwd(), OUTPUT_PATH)}`
    );
  } catch (err) {
    console.error('Failed to update BiS top snapshot', err);
    process.exitCode = 1;
  }
}

run();

