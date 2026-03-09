# SnapBid Issues

## Open Issues

---

### ISSUE-001 — `/profile` returns 404 for unauthenticated users
**Severity:** Medium  
**Found:** 2026-03-09 03:09 AM ET (automated QC check)  
**Last confirmed:** 2026-03-09 03:09 PM ET  
**Route:** `https://snapbid.app/profile`  
**Expected:** Redirect to sign-in (via Clerk middleware) or a gated page  
**Actual:** Returns Next.js 404 page  
**Impact:** The footer nav links to `/profile` on every page. Any guest who clicks it hits a dead end. Bad first impression, hurts conversion.  
**Fix:** Either add Clerk `auth().protect()` / middleware redirect, or render a sign-in prompt instead of 404.

---

### ISSUE-002 — `/api/founder-count` returns 404 → progress bar broken on upgrade page
**Severity:** High  
**Found:** 2026-03-09 03:09 AM ET (automated QC check)  
**Last confirmed:** 2026-03-09 03:09 PM ET  
**Route:** `https://snapbid.app/api/founder-count`  
**Expected:** Returns JSON `{ count: N }` so the upgrade page can render the founder progress bar dynamically  
**Actual:** 404 — API endpoint does not exist. Upgrade page renders "50 of 50 spots available" with **width:0%** progress bar.  
**Impact:** Upgrade page shows "50 of 50 spots available" with empty progress bar. Reads as ALL spots gone — kills FOMO, likely killing conversions. This is the highest-priority fix.  
**Fix:** Create `/app/api/founder-count/route.ts` that queries Stripe for active `founder` subscribers and returns `{ count, total: 50 }`. Or at minimum, hardcode a non-zero value until the real API is wired up.

---

### ISSUE-003 — Clerk publishable key has trailing newline in HTML output
**Severity:** Low  
**Found:** 2026-03-09 03:09 AM ET (automated QC check)  
**Last confirmed:** 2026-03-09 03:09 PM ET  
**Details:** `data-clerk-publishable-key` attribute and RSC `publishableKey` prop both contain `\n` at end of key string.  
**Impact:** Likely harmless (Clerk SDK probably trims it), but worth fixing to avoid edge-case auth failures.  
**Fix:** Ensure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set without a trailing newline in Vercel env vars.

---

## Resolved Issues

_(none yet)_
