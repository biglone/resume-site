#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="${REPO_DIR:-/home/Biglone/workspace/resume-site}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
OPS_VERSION_FILE="${OPS_VERSION_FILE:-/etc/resume-site/ops-version}"

log() {
  echo "[$(date -Iseconds)] $*"
}

bump_ops_version() {
  if [ ! -w "$OPS_VERSION_FILE" ]; then
    log "Ops version file not writable: $OPS_VERSION_FILE"
    return
  fi

  local date_str last count new_version
  date_str="$(date +%Y.%m.%d)"
  last="$(cat "$OPS_VERSION_FILE" 2>/dev/null || true)"

  if [[ "$last" =~ ^${date_str}\.([0-9]+)$ ]]; then
    count=$((BASH_REMATCH[1] + 1))
  else
    count=1
  fi

  new_version="${date_str}.${count}"
  printf "%s\n" "$new_version" > "$OPS_VERSION_FILE"
  log "Ops version: $new_version"
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

log "Bumping ops version..."
bump_ops_version

log "Rebuilding containers..."
docker compose up -d --build

log "Deploy complete."
