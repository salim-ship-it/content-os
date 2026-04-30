#!/usr/bin/env bash
# run-all-scrapers.sh — Daily Content OS scrape pipeline
#
# Runs LinkedIn, Reddit, and Newsletter scrapers in sequence.
# Designed to be called by cron at 7am daily.
#
# Logs to ~/.vectorlabs/scrape.log (rotated by date stamp at the top of each run).
#
# Manual test:
#   bash content-os/idea-engine/scripts/run-all-scrapers.sh

set -uo pipefail

REPO_ROOT="/Users/salim/Desktop/vectorlabs-os"
LOG_DIR="$HOME/.vectorlabs"
LOG_FILE="$LOG_DIR/scrape.log"

mkdir -p "$LOG_DIR"

# Use absolute Node path so cron's stripped PATH doesn't break anything
NODE_BIN="$(command -v node || echo /usr/local/bin/node)"
if [ ! -x "$NODE_BIN" ]; then
  for candidate in /opt/homebrew/bin/node /usr/local/bin/node /usr/bin/node; do
    if [ -x "$candidate" ]; then
      NODE_BIN="$candidate"
      break
    fi
  done
fi

cd "$REPO_ROOT" || { echo "[$(date)] FATAL: cannot cd to $REPO_ROOT" >> "$LOG_FILE"; exit 1; }

{
  echo ""
  echo "================================================================"
  echo "Content OS scrape — $(date '+%Y-%m-%d %H:%M:%S')"
  echo "Node: $NODE_BIN"
  echo "================================================================"

  echo ""
  echo "▶ Step 1/5 — LinkedIn creators"
  "$NODE_BIN" content-os/idea-engine/scripts/scrape-creators.mjs 2>&1
  STEP1=$?

  echo ""
  echo "▶ Step 2/5 — Reddit subreddits"
  "$NODE_BIN" content-os/idea-engine/scripts/scrape-reddit.mjs 2>&1
  STEP2=$?

  echo ""
  echo "▶ Step 3/5 — Newsletters"
  "$NODE_BIN" content-os/idea-engine/scripts/scrape-newsletters.mjs 2>&1
  STEP3=$?

  echo ""
  echo "▶ Step 4/5 — YouTube"
  "$NODE_BIN" content-os/idea-engine/scripts/scrape-youtube.mjs 2>&1
  STEP4=$?

  echo ""
  echo "▶ Step 5/5 — My LinkedIn posts (Analytics)"
  "$NODE_BIN" content-os/idea-engine/scripts/scrape-my-posts.mjs 2>&1
  STEP5=$?

  echo ""
  echo "Exit codes: linkedin=$STEP1 reddit=$STEP2 newsletters=$STEP3 youtube=$STEP4 my-posts=$STEP5"
  echo "Done — $(date '+%Y-%m-%d %H:%M:%S')"
  echo ""
} >> "$LOG_FILE" 2>&1
