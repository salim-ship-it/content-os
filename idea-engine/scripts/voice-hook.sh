#!/usr/bin/env bash
# voice-hook.sh — Stop hook wrapper for Claude Code
# Receives the JSON payload via stdin from Claude Code and pipes it to
# voice-hook.mjs. Exits 0 no matter what so it never blocks a session.

set +e

REPO_ROOT="/Users/salim/Desktop/vectorlabs-os"
NODE_BIN=""

# Find node in common spots (cron-style stripped PATH safety)
for candidate in /opt/homebrew/bin/node /usr/local/bin/node "$(command -v node 2>/dev/null)"; do
  if [ -x "$candidate" ]; then
    NODE_BIN="$candidate"
    break
  fi
done

if [ -z "$NODE_BIN" ]; then
  exit 0  # silent, never block
fi

"$NODE_BIN" "$REPO_ROOT/content-os/idea-engine/scripts/voice-hook.mjs" 2>>"$REPO_ROOT/.tmp/voice-hook-errors.log"
exit 0
