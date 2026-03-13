// Server Component — fetches founder count at render time so SSR HTML
// always shows the real "X of 50 claimed" value (fixes Issue #5).
// Issue #16 fix: counts completed LTD checkout.sessions (mode:payment)
// instead of subscriptions (which are always empty for one-time purchases).
// Issue #17 fix: distinct metadata so browser tabs and SEO differentiate this page.
import type { Metadata } from 'next'
import UpgradeClient from './UpgradeClient'
import Stripe from 'stripe'

export const metadata: Metadata = {
  // Use `absolute` to bypass the root layout `template: '%s | SnapBid'`.
  // Without this, Next.js appends " | SnapBid" and renders the title as
  // "Upgrade — SnapBid | Lifetime Deal | SnapBid" (duplicate brand name).
  title: { absolute: 'Upgrade — SnapBid | Lifetime Deal' },
  description:
    'Unlimited contractor quotes for a one-time payment of $59. No monthly fees, ever.',
}

const FOUNDER_SPOTS_TOTAL = 50
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 min — matches the API route cache

// Module-level cache so cold starts are cheap within the same serverless instance
let cached: { count: number; ts: number } | null = null

/**
 * Counts completed LTD purchases by paginating checkout.sessions with
 * status='complete' and filtering for mode=payment + metadata.ltd='true'.
 *
 * LTD uses mode:'payment' (one-time charge) — subscriptions.list() will
 * always return 0 for these buyers. Issue #16.
 */
async function countLTDPurchases(stripe: Stripe): Promise<number> {
  let count = 0
  let hasMore = true
  let startingAfter: string | undefined

  while (hasMore) {
    const sessions = await stripe.checkout.sessions.list({
      status: 'complete',
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    })

    // Filter to LTD sessions only (mode=payment + metadata.ltd='true')
    for (const session of sessions.data) {
      if (session.mode === 'payment' && session.metadata?.ltd === 'true') {
        count++
      }
    }

    hasMore = sessions.has_more
    if (sessions.data.length > 0) {
      startingAfter = sessions.data[sessions.data.length - 1].id
    }
  }

  return count
}

async function getFounderSpotsLeft(): Promise<number> {
  // Serve from in-process cache if fresh
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return Math.max(0, FOUNDER_SPOTS_TOTAL - cached.count)
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    // Stripe not yet configured — show full spots (honest "just launched" state)
    return FOUNDER_SPOTS_TOTAL
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const count = await countLTDPurchases(stripe)

    cached = { count, ts: Date.now() }
    return Math.max(0, FOUNDER_SPOTS_TOTAL - count)
  } catch (err) {
    console.error('[SnapBid] upgrade SSR founder-count error:', err)
    // Fall back to full spots rather than showing 0
    return FOUNDER_SPOTS_TOTAL
  }
}

export default async function UpgradePage() {
  const spotsLeft = await getFounderSpotsLeft()
  return <UpgradeClient initialSpotsLeft={spotsLeft} />
}
