import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes
let cached: { count: number; ts: number } | null = null

export async function GET() {
  // Serve from cache if fresh
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return NextResponse.json({ count: cached.count }, {
      headers: { 'Cache-Control': 'public, s-maxage=300' }
    })
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    // Return null so the UI knows Stripe isn't configured yet (vs. genuinely 0 subscribers)
    return NextResponse.json({ count: null })
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const FOUNDER_PRICE_ID = 'price_1T8uGlCg7cEQSTg1WqQiUdun'

    // Count active subscriptions on the founder price
    let count = 0
    let hasMore = true
    let startingAfter: string | undefined

    while (hasMore) {
      const subs = await stripe.subscriptions.list({
        price: FOUNDER_PRICE_ID,
        status: 'active',
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      })
      count += subs.data.length
      hasMore = subs.has_more
      if (subs.data.length > 0) {
        startingAfter = subs.data[subs.data.length - 1].id
      }
    }

    cached = { count, ts: Date.now() }
    return NextResponse.json({ count }, {
      headers: { 'Cache-Control': 'public, s-maxage=300' }
    })
  } catch (err) {
    console.error('[SnapBid] founder-count error:', err)
    return NextResponse.json({ count: 0 })
  }
}
