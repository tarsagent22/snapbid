# SnapBid — Known Issues

## Open Issues

---

### [UX/SEO] #19 — `/upgrade` page `canonical` and `og:url` both point to homepage root
**Detected:** 2026-03-13 3:11 PM ET (4h quality check cron)
**Status:** Open
**Severity:** Low (SEO / social sharing — affects how the page is indexed and how shared links preview)

**Problem:** The `/upgrade` page renders:
```html
<link rel="canonical" href="https://snapbid.app"/>
<meta property="og:url" content="https://snapbid.app"/>
```
Both should be `https://snapbid.app/upgrade`. The root layout likely defines the canonical/OG URL and the upgrade page isn't overriding it. Impact: search engines treat `/upgrade` as a duplicate of the homepage; social shares of the upgrade URL show the homepage OG card.

**Fix needed:** In `app/upgrade/page.tsx` metadata export, add:
```ts
alternates: { canonical: 'https://snapbid.app/upgrade' },
openGraph: { url: 'https://snapbid.app/upgrade', ... },
```

---

### [UX POLISH] #20 — Upgrade page progress bar shows 4% fill when 0 spots claimed
**Detected:** 2026-03-13 3:11 PM ET (4h quality check cron)
**Status:** Open
**Severity:** Low (cosmetic — trust/FOMO signal looks inconsistent to first visitors)

**Problem:** `UpgradeClient.tsx` uses `Math.max(4, spotsPercent)` for the progress bar width, so the bar always shows a 4% red fill even when 0 of 50 spots have been claimed. The text correctly reads "0 of 50 founder spots claimed / 50 left" but the non-zero bar looks contradictory — suggests activity that hasn't happened. Confirmed: `/api/founder-count` returns `{"count":0}` and `initialSpotsLeft: 50` is SSR'd correctly.

**Fix needed:** Either:
- Remove the `Math.max(4, ...)` floor so the bar is truly empty at 0 claimed (honest signal), OR  
- Keep the `Math.max(4, ...)` for visual continuity but change the bar color to `bg-gray-300` when count is 0 so it reads as "empty slot" rather than "activity."

The current state — red bar with "0 claimed" text — could make the first real buyer distrust the counter.

---

### ✅ [MINOR SEO] #18 — `/upgrade` page `<title>` had duplicate "SnapBid" suffix
**Detected:** 2026-03-13 11:11 AM ET (4h quality check cron)
**Status:** Resolved — 2026-03-13 11:20 AM ET (commit `9a08694`)
**Severity:** Low (SEO / UX — duplicate brand name in browser tab and search snippet)

**Problem:** The root `layout.tsx` defines a Next.js metadata template `'%s | SnapBid'`. The upgrade page set `title: 'Upgrade — SnapBid | Lifetime Deal'` as a plain string, so Next.js applied the template on top, producing `"Upgrade — SnapBid | Lifetime Deal | SnapBid"` — duplicate "SnapBid" in tab and search snippet.

**Fix applied:** Changed upgrade page metadata to use `title: { absolute: 'Upgrade — SnapBid | Lifetime Deal' }` which bypasses the root layout template. Live title confirmed clean: `"Upgrade — SnapBid | Lifetime Deal"`.

---

### ✅ [MINOR SEO] #17 — `/upgrade` page `<title>` is identical to homepage
**Detected:** 2026-03-13 07:11 AM ET (4h quality check cron)
**Status:** Resolved — 2026-03-13 11:05 AM ET
**Severity:** Low (SEO / browser tab UX)

**Problem:** The upgrade page used the same `<title>` as the homepage: `"SnapBid — AI Quote Generator for Contractors"`. Identical titles hurt SEO differentiation and make browser tabs indistinguishable.

**Fix applied:**
- Added `export const metadata: Metadata` to `app/upgrade/page.tsx` with:
  - `title: "Upgrade — SnapBid | Lifetime Deal"`
  - `description: "Unlimited contractor quotes for a one-time payment of $59. No monthly fees, ever."`
- Imported `type { Metadata }` from `next` for proper typing.
- Both the `<title>` tag and Open Graph title now render correctly for the upgrade page.

---

### ✅ [BUG] #16 — `/api/founder-count` always returns 0 — LTD purchases are `mode: payment`, not subscriptions
**Detected:** 2026-03-13 ~11:11 PM ET (4h quality check cron)
**Status:** Resolved — 2026-03-13 05:15 AM ET (commit `e17f594`)
**Severity:** Medium (upgrade page always shows "0 of 50 claimed" / 0% progress bar — FOMO signal broken)

**Problem:** The `founder-count` API used `stripe.subscriptions.list()` to count LTD buyers. But the LTD checkout uses `mode: 'payment'` (a one-time payment intent, not a subscription). Subscriptions list will never include LTD buyers.

**Fix applied:**
- Replaced `stripe.subscriptions.list()` with `stripe.checkout.sessions.list({ status: 'complete' })` in both `app/api/founder-count/route.ts` and `app/upgrade/page.tsx` (SSR).
- In-code filter: only counts sessions where `session.mode === 'payment' && session.metadata?.ltd === 'true'` — exactly matching what the webhook sets at purchase time.
- Both the API endpoint and SSR upgrade page now count real LTD purchases correctly.
- Verified live: `/api/founder-count` returns `{"count":0}` (accurate — no LTD purchases yet in Stripe). Will update dynamically as sales come in.

---



### ✅ [UX POLISH] #15 — History PDF exposed markup lines + unformatted currency in PDF outputs
**Detected:** 2026-03-12 11:05 PM ET (6h feature pass cron)
**Status:** Resolved — 2026-03-13 03:05 AM ET (commit `7680982`)
**Severity:** Medium (internal markup could be exposed to clients in history PDFs)

**Problem 1:** The current-quote PDF correctly filtered out "markup" line items when `showMarkupOnQuote` was false (respecting the contractor's privacy setting). However, the history PDF download (`handleDownloadHistoryPDF`) had no such filter — it rendered all line items including any with "markup" in the description, potentially exposing internal cost breakdowns to clients.

**Problem 2:** Both PDF generators (current-quote and history) rendered currency values as raw numbers (`$${value}`) without `.toLocaleString()`, so large quotes like $10,000 would display as `$10000` instead of `$10,000`. This was already fixed in the display UI (issue #11) but never applied to the jsPDF text output paths.

**Fix applied:**
- Added `showMarkupOnQuote` filter to history PDF line items (matching the current-quote PDF behavior exactly).
- Applied `.toLocaleString()` to all currency values in both PDF generators: line item unitPrices, line item totals, subtotal, tax, and grand total.
- Both PDFs now render `$10,000` not `$10000` for large values.

---

### ✅ [UX POLISH] #14 — Paywall modal showed wrong price ($9/mo instead of $59 LTD) + no history search
**Detected:** 2026-03-12 5:05 PM ET (6h feature pass cron)
**Status:** Resolved — 2026-03-12 5:30 PM ET (commit `4b8a645`)
**Severity:** High (paywall showed $9/month → confused users since checkout charges $59 LTD)

**Problem 1:** The paywall modal price display showed `$9/month ($19 crossed out)` with copy reading "Cancel anytime", but the checkout button said "Claim Lifetime Deal — $59" and the actual Stripe checkout charges $59 one-time. This mismatch destroys conversion trust — users see a monthly price, click through, and get charged something different.

**Problem 2:** Quote history had no way to search or filter as history grew — contractors couldn't find past quotes by client name or status without scrolling the whole list.

**Fix applied:**
- **Paywall price:** Corrected to show `$199 (crossed out) → $59 one-time` with copy "Pay once · Yours forever · Secured by Stripe". Now matches the actual LTD checkout price and framing.
- **History search:** Added a live search input above the history list that filters by client name, address, quote number, or job description as you type. Includes a clear button.
- **History status filter:** Added All / Won / Lost / Pending filter chips next to the search bar. Filter and search can be combined. "No quotes match" empty state with a "Clear filters" link.

---

### ✅ [UX FEATURE] #13 — Advanced Pricing settings silently missing from profile UI
**Detected:** 2026-03-12 11:05 AM ET (6h feature pass cron)
**Status:** Resolved — 2026-03-12 11:30 AM ET (commit `31db956`)
**Severity:** Medium (feature silently unusable — contractors couldn't access these settings)

**Problem:** `pricingModel`, `offerTieredOptions`, `afterHoursRate`, and all trade-specific rates (`fixtureRate`, `panelWorkRate`, `permitFeeTypical`, `sqftRateInterior`, `sqftRateExterior`, `sqftRateRoofing`, `tearOffRate`, `serviceCallRate`) were all fully wired into the AI prompt and profile schema, but had **no UI** in `app/profile/page.tsx`. Contractors had no way to set them, so the AI was always falling back to default values.

**Fix applied:**
- Added new "Advanced Pricing" section to the profile page between Business Mechanics and Quote Settings.
- **Pricing Model selector:** 3-button toggle for Time & Materials / Flat Rate / Cost-Plus — controls how the AI formats line items.
- **Tiered Options toggle:** Checkbox to enable Budget / Standard / Premium quote generation on every job.
- **After-Hours Rate field:** Used automatically when the job description or type signals emergency/after-hours.
- **Trade-specific rate fields:** Conditional on the selected trade — only shows relevant fields (plumber sees fixture rate, electrician sees panel rate + permit fee, painter sees sqft rates, roofer sees installation + tear-off rates, HVAC sees service call rate).
- All fields load/save correctly through the existing API route (which already handled these fields server-side).

---

### ✅ [UX FEATURE] #12 — No way to delete quotes from history
**Detected:** 2026-03-12 05:05 AM ET (6h feature pass cron)
**Status:** Resolved — 2026-03-12 05:15 AM ET (commit `24c728b`)
**Severity:** Low (UX friction / clutter)

**Problem:** Contractors had no way to delete test quotes, duplicates, or junk from their history. As history grew, there was no cleanup mechanism.

**Fix applied:**
- Added `deleteQuote()` function to `lib/profile.ts` (filters quote from Clerk privateMetadata).
- Added `DELETE` handler to `app/api/quotes/route.ts`.
- Added a delete button to the expanded history row in `app/page.tsx`.
- Two-tap confirmation pattern: first click shows "Confirm?" (pulsing red), second click within 4 seconds confirms and removes the quote. Auto-resets if not confirmed. Prevents accidental deletions.
- Optimistic UI: quote disappears immediately from the list after deletion; no page reload needed.

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
