#!/bin/bash
# overnight-improve.sh
# Called by nightly cron jobs to review, improve, and deploy SnapBid.
# Usage: ./overnight-improve.sh <pass_number> <hour_label>
# e.g.:  ./overnight-improve.sh 1 "12am"

PASS=$1
HOUR=$2
REPO="/home/tarsagent/.openclaw/workspace/snapbid"
LOG_FILE="/home/tarsagent/.openclaw/workspace/memory/overnight-pass-${PASS}.md"
VERCEL_TOKEN="VERCEL_TOKEN_REDACTED"

echo "=== SnapBid Overnight Pass $PASS ($HOUR) starting ==="
echo "Time: $(date)"

# Pull latest
cd "$REPO" || exit 1
git pull origin main --quiet

echo "--- Git status ---"
git log --oneline -3

echo "Done. Codebase ready for improvement agent."
