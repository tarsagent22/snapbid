# SnapBid — Known Issues

## Open Issues

---

### ✅ [UX POLISH] #11 — Currency not locale-formatted in quote display, copy, and email; PDF filenames not including quote number
**Detected:** 2026-03-11 11:05 PM ET (6h feature pass cron)
**Status:** Resolved — 2026-03-11 11:05 PM ET (commit `e565ad4`)
**Severity:** Low (cosmetic / polish)

**Problem 1:** Quote totals in the rendered quote card used raw numbers (e.g. `$10000`) instead of locale-formatted strings (`$10,000`). Same issue in copy-to-clipboard text and email body template. WhatsApp share already used `toLocaleString()` but the quote card display, copy text, and email body didn't.

**Problem 2:** History PDF downloaded with filename `snapbid-quote-{clientName}.pdf` — impossible to match saved files to specific quotes. New quote PDF used `snapbid-quote-{clientName}.pdf` too.

**Problem 3:** History PDF header was missing the "Valid for X days" line that was present in the current-quote PDF — inconsistent between the two PDF generators.

**Fix applied:**
- Added `.toLocaleString()` to all subtotal/tax/total display values in the quote result card.
- Added `.toLocaleString()` to copy-to-clipboard text and email body.
- Changed PDF filename for current quote: `snapbid-{quoteNumber}-{clientName}.pdf`
- Changed PDF filename for history PDFs: `snapbid-{quoteNumber}-{clientName}.pdf`
- Added `Valid for X days` line to history PDF header (matching the current-quote PDF).

---

### ✅ [BUG] #10 — Clerk publishable key has trailing `\n` — still live as of 2026-03-11 3:11 PM ET
**Detected:** 2026-03-11 3:11 PM ET (4h quality check cron)
**Status:** Resolved — 2026-03-11 5:05 PM ET (confirmed clean via live SSR fetch)
**Severity:** Medium — auth may appear functional but key is technically malformed in SSR HTML

**Problem:** The Clerk publishable key in the live SSR HTML still ends with a literal `\n`:
```
"publishableKey":"pk_test_ZmFzdC1tYXN0b2Rvbi03NS5jbGVyay5hY2NvdW50cy5kZXYk\n"
```
This was flagged as issue #4 on 2026-03-10 and is still unresolved. Clerk may silently strip the newline before use, but it's a malformed key value and matches the known failure pattern from TOOLS.md. Also the key is `pk_test_` — development mode — which should be swapped for `pk_live_` before public launch.

**Fix applied:** Live SSR fetch at 5:05 PM confirms clean key — `pk_test_ZmFzdC1tYXN0b2Rvbi03NS5jbGVyay5hY2NvdW50cy5kZXYk` with no trailing newline. Resolved by the redeploy in issue #4 at 3:35 PM ET. Issue #10 was a false positive from the 3:11 PM cron running before the 3:35 PM fix landed.

**Note:** Still using `pk_test_` (Clerk development instance). Should be upgraded to `pk_live_` before any major public launch.

---

### ✅ [MINOR] #9 — `/api/logo` route was dead code (never called from UI)
**Detected:** 2026-03-11 11:11 AM ET
**Status:** Resolved — 2026-03-11 (cleanup pass)
**Severity:** Low (no functional impact)

**Problem:** `app/api/logo/route.ts` existed as a dedicated POST/DELETE endpoint for logo management, but no component in the app ever called it. The profile page sends `logoDataUrl` inline through `/api/profile` POST. The `/api/logo` route was unreachable from the UI and added confusion.

**Fix applied:** Deleted `app/api/logo/route.ts`. Logo management continues to work via `/api/profile` POST which already accepts `logoDataUrl` inline.

---

### [WARNING] #4 — Clerk publishable key has trailing newline in env var
**Detected:** 2026-03-11  
**Status:** Resolved — 2026-03-11 11:10 AM ET (commit `0fab3f7`)  
**Severity:** Medium (feature silently unusable)

**Problem:** `logoDataUrl` was defined in `ContractorProfile`, preserved by the API, and rendered in PDF quote generation. But there was no upload control in `app/profile/page.tsx` — contractors had no way to set it through the UI. The API also never accepted it from the request body (it always preserved the existing value, silently ignoring any submission).

**Fix applied:**
- Extended `/api/profile` POST handler to accept `logoDataUrl` from the request body (with empty-string as a removal signal).
- Added logo upload UI to the Business Identity section: image preview with 64×64 thumbnail, file picker (PNG/JPG, 512 KB max), one-click remove button, and descriptive helper text.
- `handleSave` now includes `logoDataUrl` in the payload.
- Logo appears on PDF quotes at render time (pre-existing behavior, now actually usable).

---

### ✅ [BUG] #1 — AI overrides quoteNumber format
**Detected:** 2026-03-10  
**Status:** Resolved — 2026-03-10 05:05 AM ET  
**Severity:** Medium  
**File:** `app/api/generate-quote/route.ts`

**Problem:** The server generates a canonical `SB-XXXX` quote number (`quoteNum`) and embeds it in the AI prompt, but after parsing the AI response, `quoteData.quoteNumber` is used directly without being overridden. The AI occasionally ignores the instructed format and returns its own (e.g., `TC-2025-001` based on business name initials).

**Evidence:** Calling the API with `businessName: "Test Co"` returned `"quoteNumber": "TC-2025-001"` instead of the expected `SB-XXXX` format.

**Impact:** Inconsistent quote numbers in history, PDF exports, and email subjects. Confuses contractors who expect `SB-` prefix.

**Fix applied:** Added `quoteData.quoteNumber = quoteNum` immediately after `JSON.parse(cleaned)` — unconditionally overrides any AI-returned quote number with the server-generated `SB-XXXX` value.

---

### ✅ [UX] #6 — Intro Message profile field missing from UI (silent feature gap)
**Detected:** 2026-03-11  
**Status:** Resolved — 2026-03-11 05:15 AM ET (commit `525b7dc`)  
**Severity:** Medium (feature silently unusable)

**Problem:** `introMessage` was defined in `ContractorProfile`, saved/loaded by the API, and used by the AI in quote generation. But there was no input field in `app/profile/page.tsx` — contractors had no way to set it through the UI.

**Fix applied:** Added "Intro Message" textarea to Quote Settings section in the profile page. Includes placeholder text and helper description.

---

### ✅ [UX] #7 — Access difficulty chip colors ambiguous
**Detected:** 2026-03-11  
**Status:** Resolved — 2026-03-11 05:15 AM ET (commit `525b7dc`)  
**Severity:** Low (cosmetic)

**Problem:** Easy, Moderate, and Difficult access difficulty buttons all used `bg-amber-600` when selected — Easy and Moderate were indistinguishable.

**Fix applied:** Easy = `bg-emerald-600` (green), Moderate = `bg-amber-600` (amber), Difficult = `bg-red-500` (red).

---

### ✅ [WARNING] #4 — Clerk publishable key has trailing newline in env var
**Detected:** 2026-03-10  
**Status:** Resolved — 2026-03-11 3:35 PM ET (commit `a8e203a`)
**Severity:** Low

**Problem:** The Clerk publishable key in the Vercel env var had a trailing `\n` (newline character), visible in SSR HTML as `"pk_test_...dZXYk\n"`.

**Fix applied:** Updated env var via Vercel API (PATCH /v9/projects/.../env) with the clean 56-char key from SECRETS.md, then redeployed. SSR HTML now shows clean key without trailing newline.

**Note:** Still using `pk_test_` (Clerk development instance). Should be upgraded to `pk_live_` before any major public launch.

---

### ✅ [UX NOTE] #5 — Upgrade page progress bar shows "0 of 50 claimed" on initial SSR render
**Detected:** 2026-03-10  
**Status:** Resolved — 2026-03-10 (commit `b507e09`)
**Severity:** Low (cosmetic / FOMO signal loss)  
**Confirmed live:** 2026-03-10 03:10 AM ET (web fetch of https://snapbid.app/upgrade)

**Fix applied:** Converted `/upgrade/page.tsx` to a proper async Server Component that fetches the Stripe active subscription count at render time and passes `initialSpotsLeft` as a prop to `UpgradeClient`. SSR now shows real spot count; client re-fetches `/api/founder-count` in useEffect for freshness.

---

## Resolved Issues

---

### ✅ [BUG] #2 — /sign-up returns 404; /dashboard returns 404
**Detected:** 2026-03-09 19:09 ET  
**Resolved:** 2026-03-09 23:05 ET (commit `eee13d4`)  

**Fix applied:** Created `/app/sign-up/[[...sign-up]]/page.tsx` with `<SignUp />` component (mirrors sign-in pattern, redirects to `/profile` post-auth). Added `/sign-up(.*)` to public routes in middleware. `/dashboard` 404 is acceptable — app uses `/profile` as the post-login destination.

---

### ✅ [UX] #3 — Upgrade page progress bar label contradicted bar fill
**Detected:** 2026-03-09 19:09 ET  
**Resolved:** 2026-03-09 23:05 ET (commit `eee13d4`)  

**Fix applied:** Fixed label to read "X of 50 spots claimed / Y left" so bar fill and text consistently describe spots *taken*, eliminating the contradiction.
