#!/usr/bin/env bash

set -euo pipefail

BRANCH="${1:-main}"
TARGET_ENV="${2:-prod}"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEFAULT_GITHUB_KEY="/home/ubuntu/.ssh/id_ed25519_github_deploy"
GIT_SSH_COMMAND_VALUE="${GIT_SSH_COMMAND:-}"
COMPOSE_FILE="${COMPOSE_FILE:-}"

cd "$REPO_DIR"

normalize_env() {
  case "$1" in
    prod|production|main)
      echo "prod"
      ;;
    dev)
      echo "dev"
      ;;
    *)
      echo "unknown"
      ;;
  esac
}

echo "Deploying branch: $BRANCH"
echo "Target environment: $TARGET_ENV"
echo "Repository: $REPO_DIR"

NORMALIZED_ENV="$(normalize_env "$TARGET_ENV")"
if [[ "$NORMALIZED_ENV" == "unknown" ]]; then
  echo "Unsupported target environment: $TARGET_ENV"
  exit 1
fi

case "$NORMALIZED_ENV" in
  prod)
    if [[ "$BRANCH" != "main" ]]; then
      echo "Refusing production deploy: target_env=$TARGET_ENV requires branch=main"
      exit 1
    fi
    ;;
  dev)
    if [[ "$BRANCH" != "dev" ]]; then
      echo "Refusing development deploy: target_env=dev requires branch=dev"
      exit 1
    fi
    ;;
esac

# Hard guard: every deploy directory must declare its environment.
# Create one file per server path:
#   echo prod > .zeravue-deploy-env   (for production path)
#   echo dev  > .zeravue-deploy-env   (for development path)
DEPLOY_ENV_FILE=".zeravue-deploy-env"
if [[ ! -f "$DEPLOY_ENV_FILE" ]]; then
  echo "Missing $DEPLOY_ENV_FILE in $REPO_DIR"
  echo "Set it to 'prod' or 'dev' to lock this path to one environment."
  exit 1
fi

EXPECTED_ENV="$(tr -d '[:space:]' < "$DEPLOY_ENV_FILE")"
if [[ "$EXPECTED_ENV" != "$NORMALIZED_ENV" ]]; then
  echo "Deploy path/environment mismatch: file=$EXPECTED_ENV, requested=$NORMALIZED_ENV"
  echo "Refusing deploy to prevent dev/prod crossover."
  exit 1
fi

if [[ -z "$GIT_SSH_COMMAND_VALUE" && -f "$DEFAULT_GITHUB_KEY" ]]; then
  GIT_SSH_COMMAND_VALUE="ssh -i $DEFAULT_GITHUB_KEY -o IdentitiesOnly=yes"
fi

if [[ -z "$COMPOSE_FILE" ]]; then
  case "$NORMALIZED_ENV" in
    dev)
      COMPOSE_FILE="docker-compose.dev.yml"
      ;;
    prod)
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

echo "Checked out commit: $(git rev-parse --short HEAD) on branch $(git rev-parse --abbrev-ref HEAD)"

if [[ "$NORMALIZED_ENV" == "prod" ]]; then
  # Keep prod runtime tree lean: dev logs are not required for serving.
  rm -rf docs/devlog
fi

docker compose -f "$COMPOSE_FILE" up -d --build

echo "Deployment complete."
