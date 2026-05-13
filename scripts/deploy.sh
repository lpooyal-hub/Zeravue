#!/usr/bin/env bash

set -euo pipefail

BRANCH="${1:-main}"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEFAULT_GITHUB_KEY="/home/ubuntu/.ssh/id_ed25519_github_deploy"
GIT_SSH_COMMAND_VALUE="${GIT_SSH_COMMAND:-}"

cd "$REPO_DIR"

echo "Deploying branch: $BRANCH"
echo "Repository: $REPO_DIR"

if [[ -z "$GIT_SSH_COMMAND_VALUE" && -f "$DEFAULT_GITHUB_KEY" ]]; then
  GIT_SSH_COMMAND_VALUE="ssh -i $DEFAULT_GITHUB_KEY -o IdentitiesOnly=yes"
fi

if [[ -n "$GIT_SSH_COMMAND_VALUE" ]]; then
  GIT_SSH_COMMAND="$GIT_SSH_COMMAND_VALUE" git fetch origin "$BRANCH"
  git checkout "$BRANCH"
  GIT_SSH_COMMAND="$GIT_SSH_COMMAND_VALUE" git pull --ff-only origin "$BRANCH"
else
  git fetch origin "$BRANCH"
  git checkout "$BRANCH"
  git pull --ff-only origin "$BRANCH"
fi

docker compose up -d --build

echo "Deployment complete."
