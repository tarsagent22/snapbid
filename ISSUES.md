# SnapBid Issues Log

---

## [2026-03-09] Issue #1 — Clerk publishable key has trailing newline in HTML (MEDIUM)

**Detected:** 2026-03-09 19:09 ET (automated QC check)
**Status:** Open

**Description:**
The Clerk publishable key embedded in the SSR HTML contains a literal newline character:

```
"publishableKey":"pk_test_ZmFzdC1tYXN0b2Rvbi03NS5jbGVyay5hY2NvdW50cy5kZXYk\n"
```

The `\n` is visible in the raw page source. While Clerk's client-side JS may strip it before use, this is a code hygiene issue and could cause subtle auth failures or warnings in some environments. The key should be trimmed at build time (e.g., `.trim()` on the env var read).

**Steps to reproduce:** `curl -s https://snapbid.app | grep publishableKey`

**Impact:** Low-medium. Probably not breaking today, but bad practice and may cause issues with future Clerk versions.

---

## [2026-03-09] Issue #2 — /sign-up returns 404; /dashboard returns 404 (HIGH)

**Detected:** 2026-03-09 19:09 ET (automated QC check)
**Status:** Open

**Description:**
- `https://snapbid.app/sign-up` → **404**
- `https://snapbid.app/dashboard` → **404**

`/sign-in` works (200), but there is no `/sign-up` route. Clerk's default auth flow often looks for `/sign-up` as the sign-up URL. If the Clerk config points users to `/sign-up` after certain flows, they'll hit a 404. Also, `/dashboard` 404 means any post-login redirect to `/dashboard` would break.

The sign-in page SSR shows `"forceRedirectUrl":"/profile"` which is correct (not `/dashboard`), but the missing `/sign-up` is a gap — new users clicking "Sign up" in the Clerk modal may be redirected to a dead route.

**Steps to reproduce:**
```
curl -o /dev/null -w "%{http_code}" https://snapbid.app/sign-up   # → 404
curl -o /dev/null -w "%{http_code}" https://snapbid.app/dashboard  # → 404
```

**Impact:** HIGH for new user acquisition. If any user clicks "Don't have an account? Sign up" in Clerk's modal, they may land on a 404.

**Suggested fix:** Add a `/sign-up` page that renders `<SignUp />` (parallel to the `/sign-in` page), or confirm that Clerk is configured to use a different sign-up URL and verify that URL exists.

---

## [2026-03-09] Issue #3 — Upgrade page progress bar shows 2/50 spots taken but counter reads "50 of 50 available" (LOW/UX)

**Detected:** 2026-03-09 19:09 ET (automated QC check)
**Status:** Open

**Description:**
On `/upgrade`, the progress bar width is set to `4%` (approximately 2 of 50 users), but the text reads:

> "50 of 50 spots available"

These two signals contradict each other. The bar implies ~2 signups, but the text says 0 signups (all 50 still open). This looks like a wiring bug — the spot counter text isn't reading from the same data source as the bar width, or one of them is hardcoded.

**Steps to reproduce:** `curl -s https://snapbid.app/upgrade | grep -A2 "spots available"`

**Impact:** Low severity functionally, but looks unprofessional and erodes trust for potential paying customers landing on the upgrade page.

**Suggested fix:** Make both the bar width and the "X of 50 spots available" text derive from the same live value (current subscriber count). Currently either the bar or the text is stale/hardcoded.

---
