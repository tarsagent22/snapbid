import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { currentUser } from '@clerk/nextjs/server'

// TODO: Create a Price in the Stripe Dashboard:
// 1. Go to https://dashboard.stripe.com/products (use test mode)
// 2. Create product "SnapBid Pro" → recurring price $19/month
// 3. Copy the Price ID (starts with price_...) → set env var STRIPE_PRICE_ID
// Then set STRIPE_PRICE_ID in Vercel env vars.

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not set')
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

export async function POST(req: NextRequest) {
  const user = await currentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const priceId = process.env.STRIPE_PRICE_ID
  if (!priceId) {
    console.error(
      '[SnapBid] STRIPE_PRICE_ID is not set. ' +
      'Create a $19/mo recurring price in Stripe Dashboard and set this env var.'
    )
    return NextResponse.json(
      { error: 'Stripe not configured — STRIPE_PRICE_ID missing' },
      { status: 500 }
    )
  }

  const stripe = getStripe()
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: 'https://snapbid.app/?upgraded=true',
    cancel_url: 'https://snapbid.app/',
    customer_email: user.emailAddresses[0]?.emailAddress,
    metadata: {
      clerk_user_id: user.id,
    },
    subscription_data: {
      metadata: {
        clerk_user_id: user.id,
      },
    },
  })

  return NextResponse.json({ url: session.url })
}
