#!/usr/bin/env bash

set -euo pipefail

BRANCH="${1:-main}"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEFAULT_GITHUB_KEY="/home/ubuntu/.ssh/id_ed25519_github"

cd "$REPO_DIR"

echo "Deploying branch: $BRANCH"
echo "Repository: $REPO_DIR"

if [[ -z "${GIT_SSH_COMMAND:-}" && -f "$DEFAULT_GITHUB_KEY" ]]; then
  export GIT_SSH_COMMAND="ssh -i $DEFAULT_GITHUB_KEY -o IdentitiesOnly=yes"
fi

git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"
docker compose up -d --build

echo "Deployment complete."
