#!/usr/bin/env bash
# SnapBid Blog QA Validation Script
# Runs automatically via GitHub Actions on every push to main.
# Exit code 0 = all checks pass. Exit code 1 = one or more failures.

set -euo pipefail

BLOG_DIR="content/blog"
ERRORS=()
CURRENT_YEAR=$(date +%Y)
PREV_YEAR=$((CURRENT_YEAR - 1))

# ─── Helpers ────────────────────────────────────────────────────────────────

fail() { ERRORS+=("❌ $1"); }
info() { echo "  ✓ $1"; }

# Extract frontmatter field value
fm_field() {
  local file="$1" field="$2"
  awk "/^---/{p++} p==1 && /^${field}:/{gsub(/^${field}:[[:space:]]*[\"']?|[\"']?$/, \"\"); print; exit}" "$file"
}

# ─── Check 1: Blog posts exist ──────────────────────────────────────────────
echo ""
echo "▶ Checking blog directory..."
if [ ! -d "$BLOG_DIR" ]; then
  echo "  No blog directory found — skipping blog checks."
  exit 0
fi

MD_FILES=()
while IFS= read -r f; do
  local_name="$(basename "$f")"
  [[ "$local_name" == "keyword-tracker.md" ]] && continue
  [[ "$local_name" == "queue.md" ]] && continue
  [[ "$local_name" == "affiliate-links.json" ]] && continue
  # skip any file in feedback/ or rejected/ subdirs
  [[ "$f" == */feedback/* ]] && continue
  [[ "$f" == */rejected/* ]] && continue
  MD_FILES+=("$f")
done < <(find "$BLOG_DIR" -maxdepth 1 -name "*.md" | sort)

if [ ${#MD_FILES[@]} -eq 0 ]; then
  echo "  No markdown files found — skipping blog checks."
  exit 0
fi

# ─── Check 2: Year accuracy ─────────────────────────────────────────────────
echo ""
echo "▶ Checking year references..."
for f in "${MD_FILES[@]}"; do
  slug=$(basename "$f" .md)
  # Flag past year in title or headings
  if grep -qE "^(title:|#+ .*)(.*${PREV_YEAR})" "$f"; then
    fail "$slug: Contains past year (${PREV_YEAR}) in title or heading"
  fi
  # Flag posts older than 7 days that use "current" or "latest" without dateModified
  pub_date=$(fm_field "$f" "date" | tr -d '"')
  date_modified=$(fm_field "$f" "dateModified" | tr -d '"')
  if [ -n "$pub_date" ]; then
    pub_epoch=$(date -d "$pub_date" +%s 2>/dev/null || date -j -f "%Y-%m-%d" "$pub_date" +%s 2>/dev/null || echo 0)
    now_epoch=$(date +%s)
    age_days=$(( (now_epoch - pub_epoch) / 86400 ))
    if [ "$age_days" -gt 7 ] && grep -qiE "\b(current|latest)\b" "$f" && [ -z "$date_modified" ]; then
      fail "$slug: Uses 'current'/'latest' pricing but is $age_days days old with no dateModified field"
    fi
  fi
done
info "Year checks complete"

# ─── Check 3: SEO essentials ────────────────────────────────────────────────
echo ""
echo "▶ Checking SEO requirements..."
SEEN_TITLES=()
for f in "${MD_FILES[@]}"; do
  slug=$(basename "$f" .md)
  title=$(fm_field "$f" "title" | tr -d '"')
  desc=$(fm_field "$f" "description" | tr -d '"')

  # Title length
  title_len=${#title}
  if [ "$title_len" -gt 60 ]; then
    fail "$slug: Title is ${title_len} chars (max 60): '$title'"
  fi

  # Description length
  desc_len=${#desc}
  if [ "$desc_len" -gt 160 ]; then
    fail "$slug: Description is ${desc_len} chars (max 160)"
  fi

  # At least one H1
  if ! grep -qE "^# " "$f"; then
    fail "$slug: No H1 found"
  fi

  # Exactly one H1 (not multiple)
  h1_count=$(grep -cE "^# " "$f" || true)
  if [ "$h1_count" -gt 1 ]; then
    fail "$slug: Multiple H1s found ($h1_count)"
  fi

  # CTA link to estimator
  if ! grep -qE "\]\(https?://snapbid\.app[^)]*\)|\]\(/\)" "$f"; then
    fail "$slug: No CTA link to snapbid.app estimator found"
  fi

  # Duplicate title check
  for seen in "${SEEN_TITLES[@]}"; do
    if [ "$seen" = "$title" ]; then
      fail "$slug: Duplicate title '$title'"
    fi
  done
  SEEN_TITLES+=("$title")
done
info "SEO checks complete"

# ─── Check 4: Content minimums ──────────────────────────────────────────────
echo ""
echo "▶ Checking content minimums..."
for f in "${MD_FILES[@]}"; do
  slug=$(basename "$f" .md)

  # Word count (strip frontmatter first)
  body=$(awk '/^---/{p++} p>=2{print}' "$f")
  word_count=$(echo "$body" | wc -w)
  if [ "$word_count" -lt 1000 ]; then
    fail "$slug: Only $word_count words (minimum 1,000)"
  fi

  # Internal link count
  link_count=$(grep -oE "\]\((/[^)]*|https://snapbid\.app[^)]*)\)" "$f" | wc -l || echo 0)
  if [ "$link_count" -lt 3 ]; then
    fail "$slug: Only $link_count internal links (minimum 3)"
  fi
done
info "Content minimum checks complete"

# ─── Check 5: Brand consistency ─────────────────────────────────────────────
echo ""
echo "▶ Checking brand consistency..."
BANNED_PHRASES=(
  "Built for tradespeople"
  "Business Name"
  "Client Name"
  "Client Email"
  "Generate a quote"
)
for f in "${MD_FILES[@]}"; do
  slug=$(basename "$f" .md)
  for phrase in "${BANNED_PHRASES[@]}"; do
    if grep -qi "$phrase" "$f"; then
      fail "$slug: Contains banned phrase: '$phrase'"
    fi
  done
done
info "Brand consistency checks complete"

# ─── Check 6: Keyword tracker exists ────────────────────────────────────────
echo ""
echo "▶ Checking keyword tracker..."
if [ ! -f "$BLOG_DIR/keyword-tracker.md" ]; then
  fail "keyword-tracker.md not found in $BLOG_DIR"
else
  info "keyword-tracker.md found"
fi

# ─── Results ────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ ${#ERRORS[@]} -eq 0 ]; then
  echo "✅ All QA checks passed"
  exit 0
else
  echo "❌ ${#ERRORS[@]} QA check(s) failed:"
  for err in "${ERRORS[@]}"; do
    echo "  $err"
  done
  exit 1
fi
