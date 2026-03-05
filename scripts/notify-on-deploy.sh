#!/bin/bash
# notify-on-deploy.sh
# Poll for a new git commit and notify Chandler via Telegram when detected.
# Usage: ./notify-on-deploy.sh "what was built" &
# Runs in background, checks every 30s for up to 30 minutes.

WHAT="${1:-Build complete}"
REPO="/home/tarsagent/.openclaw/workspace/snapbid"
INITIAL_COMMIT=$(cd "$REPO" && git rev-parse HEAD 2>/dev/null)
MAX_WAIT=1800  # 30 minutes
ELAPSED=0

while [ $ELAPSED -lt $MAX_WAIT ]; do
  sleep 30
  ELAPSED=$((ELAPSED + 30))
  CURRENT_COMMIT=$(cd "$REPO" && git rev-parse HEAD 2>/dev/null)
  if [ "$CURRENT_COMMIT" != "$INITIAL_COMMIT" ]; then
    openclaw system event --text "✅ Done: $WHAT — snapbid.app is updated" --mode now
    exit 0
  fi
done

# Timed out
openclaw system event --text "⚠️ Build may have stalled: $WHAT — check manually" --mode now
