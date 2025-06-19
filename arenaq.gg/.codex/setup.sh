#!/bin/bash
set -euo pipefail

# Disable Angular CLI analytics to avoid interactive prompts
export NG_CLI_ANALYTICS=false

# Install Angular CLI globally (requires network access or a pre-bundled package)
npm install -g @angular/cli@19

# Install project dependencies
npm ci            # or `npm install` if you don’t use package-lock.json