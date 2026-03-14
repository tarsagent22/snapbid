#!/bin/bash
# SnapBid Blog Post Publisher
# Full pipeline: QA → deploy → generate pin image → fire Zapier webhook
#
# Usage:
#   ./scripts/publish-blog-post.sh \
#     --slug "roof-replacement-cost-nashville-tn" \
#     --title "Roof Replacement Cost in Nashville, TN (2026)" \
#     --description "Replacing a roof in Nashville typically costs $7,500–$18,000..." \
#     --cost "Average: \$7,500–\$18,000" \
#     --project-type "roof" \
#     --hashtags "#RoofReplacement #Roofing #HomeImprovement"
#
# Requires:
#   REPLICATE_API_TOKEN env var (or reads from SECRETS.md)
#   ZAPIER_WEBHOOK_URL env var (or uses hardcoded value below)

set -e
cd "$(dirname "${BASH_SOURCE[0]}")/.."

# ── Config ────────────────────────────────────────────────────────────────────
ZAPIER_WEBHOOK_URL="${ZAPIER_WEBHOOK_URL:-https://hooks.zapier.com/hooks/catch/26823609/ux7nwn7/}"
REPLICATE_TOKEN="${REPLICATE_API_TOKEN:-}"
if [ -z "$REPLICATE_TOKEN" ]; then
  echo "❌ REPLICATE_API_TOKEN not set. Export it before running this script."
  exit 1
fi
DOWNLOADS_DIR="public/downloads"
BLOG_BASE_URL="https://snapbid.app/blog"

# ── Parse args ────────────────────────────────────────────────────────────────
SLUG="" TITLE="" DESCRIPTION="" COST="" PROJECT_TYPE="default" HASHTAGS="#HomeImprovement #HomeRenovation #HomeCost"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --slug)         SLUG="$2"; shift 2 ;;
    --title)        TITLE="$2"; shift 2 ;;
    --description)  DESCRIPTION="$2"; shift 2 ;;
    --cost)         COST="$2"; shift 2 ;;
    --project-type) PROJECT_TYPE="$2"; shift 2 ;;
    --hashtags)     HASHTAGS="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

if [[ -z "$SLUG" || -z "$TITLE" || -z "$DESCRIPTION" || -z "$COST" ]]; then
  echo "Usage: $0 --slug SLUG --title TITLE --description DESC --cost COST [--project-type TYPE] [--hashtags TAGS]"
  exit 1
fi

POST_FILE="content/blog/${SLUG}.md"
PIN_FILE="${DOWNLOADS_DIR}/pin-${SLUG}.png"
POST_URL="${BLOG_BASE_URL}/${SLUG}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "▶ Publishing: $TITLE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Step 1: Verify post exists ────────────────────────────────────────────────
echo ""
echo "▶ Step 1/5: Checking post file..."
if [ ! -f "$POST_FILE" ]; then
  echo "❌ Post file not found: $POST_FILE"
  exit 1
fi
echo "  ✓ Found: $POST_FILE"

# ── Step 2: QA validation ─────────────────────────────────────────────────────
echo ""
echo "▶ Step 2/5: Running QA checks..."
bash scripts/validate-blog.sh
echo "  ✓ All QA checks passed"

# ── Step 3: Deploy ────────────────────────────────────────────────────────────
echo ""
echo "▶ Step 3/5: Deploying..."
./scripts/deploy.sh "content: $TITLE"

# ── Step 4: Generate pin image ────────────────────────────────────────────────
echo ""
echo "▶ Step 4/5: Generating Pinterest pin image..."

# Project type → Flux Pro prompt
case "$PROJECT_TYPE" in
  bathroom)  PROMPT="Elegant modern bathroom interior with subway tile, natural light, professional real estate photography, no people, no text" ;;
  kitchen)   PROMPT="Beautiful modern kitchen with white cabinets, quartz countertops, professional real estate photography, natural light, no people, no text" ;;
  roof)      PROMPT="Beautiful suburban house exterior with new architectural shingle roof, blue sky, green lawn, professional photography, no people, no text" ;;
  deck)      PROMPT="Beautiful wood composite deck with outdoor furniture, backyard, professional real estate photography, no people, no text" ;;
  hvac)      PROMPT="Modern home exterior with new HVAC unit, clean suburban house, professional photography, no people, no text" ;;
  flooring)  PROMPT="Beautiful hardwood floor in bright living room, professional real estate photography, natural light, no people, no text" ;;
  painting)  PROMPT="Freshly painted bright living room, clean walls, neutral tones, professional real estate photography, no people, no text" ;;
  *)         PROMPT="Beautiful modern home interior, professional real estate photography, natural light, no people, no text" ;;
esac

echo "  Generating image via Replicate (Flux Pro)..."
PREDICTION=$(curl -s -X POST "https://api.replicate.com/v1/models/black-forest-labs/flux-pro/predictions" \
  -H "Authorization: Bearer $REPLICATE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"input\":{\"prompt\":\"$PROMPT\",\"width\":1024,\"height\":1024,\"output_format\":\"png\"}}")

PREDICTION_ID=$(echo "$PREDICTION" | python3 -c "import json,sys; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)
if [ -z "$PREDICTION_ID" ]; then
  echo "  ❌ Failed to start Replicate prediction"
  echo "$PREDICTION"
  exit 1
fi
echo "  Prediction ID: $PREDICTION_ID — waiting for image..."

# Poll until done
IMAGE_URL=""
for i in {1..24}; do
  sleep 5
  RESULT=$(curl -s "https://api.replicate.com/v1/predictions/$PREDICTION_ID" \
    -H "Authorization: Bearer $REPLICATE_TOKEN")
  STATUS=$(echo "$RESULT" | python3 -c "import json,sys; print(json.load(sys.stdin).get('status',''))" 2>/dev/null)
  if [ "$STATUS" = "succeeded" ]; then
    IMAGE_URL=$(echo "$RESULT" | python3 -c "import json,sys; d=json.load(sys.stdin); o=d.get('output'); print(o[0] if isinstance(o,list) else o)" 2>/dev/null)
    break
  elif [ "$STATUS" = "failed" ]; then
    echo "  ❌ Replicate prediction failed"
    exit 1
  fi
  echo "  ...waiting ($i/24, status: $STATUS)"
done

if [ -z "$IMAGE_URL" ]; then
  echo "  ❌ Timed out waiting for image"
  exit 1
fi

echo "  ✓ Image generated: $IMAGE_URL"

# Download base image
BASE_TMP="/tmp/pin-base-${SLUG}.png"
curl -sL "$IMAGE_URL" -o "$BASE_TMP"

# Overlay text with Python/Pillow
python3 << PYEOF
from PIL import Image, ImageDraw, ImageFont

img = Image.open("$BASE_TMP").convert("RGBA")
overlay = Image.new("RGBA", img.size, (0,0,0,0))
draw = ImageDraw.Draw(overlay)
w, h = img.size

# Dark gradient top half
for y in range(int(h * 0.52)):
    alpha = int(195 * (1 - y / (h * 0.52)))
    draw.line([(0, y), (w, y)], fill=(0, 0, 0, alpha))

# Maroon strip bottom
for y in range(int(h * 0.91), h):
    draw.line([(0, y), (w, y)], fill=(153, 27, 27, 220))

img = Image.alpha_composite(img, overlay)
draw = ImageDraw.Draw(img)

def load_font(size):
    for fp in [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
    ]:
        try: return ImageFont.truetype(fp, size)
        except: pass
    return ImageFont.load_default()

title_font = load_font(68)
cost_font = load_font(50)
brand_font = load_font(30)

# Word-wrap title
title = """$TITLE"""
words = title.split()
lines, current = [], ""
for word in words:
    test = (current + " " + word).strip()
    bbox = draw.textbbox((0,0), test, font=title_font)
    if bbox[2] - bbox[0] > w - 100:
        if current: lines.append(current)
        current = word
    else:
        current = test
if current: lines.append(current)

y = 60
for line in lines:
    bbox = draw.textbbox((0,0), line, font=title_font)
    x = (w - (bbox[2]-bbox[0])) // 2
    draw.text((x+2, y+2), line, font=title_font, fill=(0,0,0,200))
    draw.text((x, y), line, font=title_font, fill=(255,255,255,255))
    y += bbox[3] - bbox[1] + 12

y += 24
cost = """$COST"""
bbox = draw.textbbox((0,0), cost, font=cost_font)
x = (w - (bbox[2]-bbox[0])) // 2
draw.text((x+1, y+1), cost, font=cost_font, fill=(0,0,0,180))
draw.text((x, y), cost, font=cost_font, fill=(217,119,6,255))

brand = "snapbid.app"
bbox = draw.textbbox((0,0), brand, font=brand_font)
x = (w - (bbox[2]-bbox[0])) // 2
draw.text((x, h-52), brand, font=brand_font, fill=(255,255,255,255))

img.convert("RGB").save("$PIN_FILE", "PNG", quality=95)
print("  Pin image saved: $PIN_FILE")
PYEOF

# Commit and push the pin image
git add "$PIN_FILE"
git commit -m "chore: add pin image for $SLUG"
git push origin main
echo "  ✓ Pin image deployed"

# ── Step 5: Fire Zapier webhook ───────────────────────────────────────────────
echo ""
echo "▶ Step 5/5: Publishing pin via Zapier..."

PIN_URL="https://snapbid.app/downloads/pin-${SLUG}.png"
FULL_DESCRIPTION="$DESCRIPTION $HASHTAGS"

ZAPIER_RESPONSE=$(curl -s -X POST "$ZAPIER_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"$TITLE\",
    \"description\": \"$FULL_DESCRIPTION\",
    \"post_url\": \"$POST_URL\",
    \"image_url\": \"$PIN_URL\"
  }" -w "\n%{http_code}")

HTTP_STATUS=$(echo "$ZAPIER_RESPONSE" | tail -1)
if [ "$HTTP_STATUS" = "200" ]; then
  echo "  ✓ Pin queued to Pinterest via Zapier"
else
  echo "  ⚠️  Zapier returned HTTP $HTTP_STATUS"
fi

# ── Update keyword tracker ────────────────────────────────────────────────────
echo ""
TODAY=$(date +%Y-%m-%d)
WORD_COUNT=$(wc -w < "$POST_FILE")
echo "  Updating keyword tracker..."
# Append row to tracker (simple approach — assumes table exists)
sed -i "/^| Keyword | URL/,/^$/{/^$/i| $TITLE | /blog/$SLUG | $TODAY | $WORD_COUNT | $TODAY |
}" content/blog/keyword-tracker.md 2>/dev/null || true

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Published: $TITLE"
echo "   Post: $POST_URL"
echo "   Pin:  $PIN_URL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
