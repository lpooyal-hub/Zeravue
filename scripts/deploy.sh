#!/usr/bin/env bash

set -euo pipefail

BRANCH="${1:-main}"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$REPO_DIR"

echo "Deploying branch: $BRANCH"
echo "Repository: $REPO_DIR"

git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"
docker compose up -d --build

echo "Deployment complete."
