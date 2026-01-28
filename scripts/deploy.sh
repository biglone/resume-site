#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="${REPO_DIR:-/home/Biglone/workspace/resume-site}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"

log() {
  echo "[$(date -Iseconds)] $*"
}

cd "$REPO_DIR"

if [ -n "$(git status --porcelain)" ]; then
  log "Working tree has local changes. Aborting deploy."
  exit 1
fi

log "Fetching origin/$DEPLOY_BRANCH..."
git fetch origin "$DEPLOY_BRANCH"

log "Updating working tree..."
git merge --ff-only "origin/$DEPLOY_BRANCH"

log "Rebuilding containers..."
docker compose up -d --build

log "Deploy complete."
