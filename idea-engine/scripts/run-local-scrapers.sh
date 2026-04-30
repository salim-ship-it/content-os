#!/bin/bash
# run-local-scrapers.sh — daily scrapers that must run locally (not on GH Actions)
#
# Runs:
#   1. Reddit scraper (blocked from cloud IPs, works from residential)
#   2. Lead magnet comment scraper (pulls posts you commented on)
#
# Called by launchd daily at 10:00 AM local time.
# Logs to ~/.vectorlabs/scraper.log

set -euo pipefail

REPO_DIR="/Users/salim/Desktop/vectorlabs-os"
LOG_DIR="$HOME/.vectorlabs"
LOG_FILE="$LOG_DIR/scraper.log"
ENV_FILE="$REPO_DIR/.env.local"

mkdir -p "$LOG_DIR"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Load env vars
if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

log "=== Daily local scrape started ==="

# Reddit
log "Starting Reddit scraper..."
if node "$REPO_DIR/content-os/idea-engine/scripts/scrape-reddit.mjs" >> "$LOG_FILE" 2>&1; then
  log "Reddit scraper: SUCCESS"
else
  log "Reddit scraper: FAILED (exit $?)"
fi

# Lead magnet comments
log "Starting comment scraper..."
if node "$REPO_DIR/content-os/idea-engine/scripts/scrape-my-comments.mjs" >> "$LOG_FILE" 2>&1; then
  log "Comment scraper: SUCCESS"
else
  log "Comment scraper: FAILED (exit $?)"
fi

log "=== Daily local scrape finished ==="
