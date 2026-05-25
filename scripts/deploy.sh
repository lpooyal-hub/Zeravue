#!/usr/bin/env bash

set -euo pipefail

BRANCH="${1:-main}"
TARGET_ENV="${2:-prod}"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEFAULT_GITHUB_KEY="/home/ubuntu/.ssh/id_ed25519_github_deploy"
GIT_SSH_COMMAND_VALUE="${GIT_SSH_COMMAND:-}"
COMPOSE_FILE="${COMPOSE_FILE:-}"

cd "$REPO_DIR"

echo "Deploying branch: $BRANCH"
echo "Target environment: $TARGET_ENV"
echo "Repository: $REPO_DIR"

if [[ -z "$GIT_SSH_COMMAND_VALUE" && -f "$DEFAULT_GITHUB_KEY" ]]; then
  GIT_SSH_COMMAND_VALUE="ssh -i $DEFAULT_GITHUB_KEY -o IdentitiesOnly=yes"
fi

if [[ -z "$COMPOSE_FILE" ]]; then
  case "$TARGET_ENV" in
    dev)
      COMPOSE_FILE="docker-compose.dev.yml"
      ;;
    prod|production|main)
      COMPOSE_FILE="docker-compose.prod.yml"
      ;;
    *)
      COMPOSE_FILE="docker-compose.yml"
      ;;
  esac
fi

echo "Using compose file: $COMPOSE_FILE"

if [[ -n "$GIT_SSH_COMMAND_VALUE" ]]; then
  GIT_SSH_COMMAND="$GIT_SSH_COMMAND_VALUE" git fetch origin "$BRANCH"
  git checkout "$BRANCH"
  GIT_SSH_COMMAND="$GIT_SSH_COMMAND_VALUE" git pull --ff-only origin "$BRANCH"
else
  git fetch origin "$BRANCH"
  git checkout "$BRANCH"
  git pull --ff-only origin "$BRANCH"
fi

docker compose -f "$COMPOSE_FILE" up -d --build

echo "Deployment complete."
