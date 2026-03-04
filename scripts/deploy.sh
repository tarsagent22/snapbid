#!/bin/bash
# SnapBid deploy script — run from workspace/snapbid
# Usage: ./scripts/deploy.sh "optional commit message"
set -e
cd "$(dirname "${BASH_SOURCE[0]}")/.."

# Token read from environment or secrets file
VERCEL_TOKEN="${VERCEL_TOKEN:-$(grep 'Token (snapbid):' /home/tarsagent/.openclaw/workspace/SECRETS.md | grep -v 'Personal\|GitHub\|PAT' | awk '{print $NF}' | tr -d '[:space:]')}"
COMMIT_MSG="${1:-chore: update}"

echo "▶ Building..."
npm run build

echo "▶ Committing & pushing..."
git add -A
git diff --cached --quiet || git commit -m "$COMMIT_MSG"
git push origin main

echo "▶ Deploying to Vercel..."
vercel --token "$VERCEL_TOKEN" --prod --yes 2>&1 | tail -5

echo "▶ Verifying..."
sleep 5
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://snapbid.app)
if [ "$STATUS" = "200" ]; then
  echo "✅ snapbid.app is live (HTTP $STATUS)"
else
  echo "⚠️  snapbid.app returned HTTP $STATUS"
  exit 1
fi
