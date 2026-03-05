import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { clerkClient } from '@clerk/nextjs/server'

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not set')
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

export async function POST(req: NextRequest) {
  const stripe = getStripe()
  const rawBody = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[SnapBid] STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err: any) {
    console.error('[SnapBid] Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  const clerk = await clerkClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const clerkUserId = session.metadata?.clerk_user_id
        if (!clerkUserId) break

        await clerk.users.updateUserMetadata(clerkUserId, {
          publicMetadata: {
            subscribed: true,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
          },
        })
        console.log(`[SnapBid] User ${clerkUserId} subscribed via checkout.session.completed`)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const clerkUserId = subscription.metadata?.clerk_user_id
        if (!clerkUserId) break

        const isActive = ['active', 'trialing'].includes(subscription.status)
        await clerk.users.updateUserMetadata(clerkUserId, {
          publicMetadata: {
            subscribed: isActive,
            stripe_subscription_id: subscription.id,
            stripe_subscription_status: subscription.status,
          },
        })
        console.log(`[SnapBid] User ${clerkUserId} subscription updated: ${subscription.status}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const clerkUserId = subscription.metadata?.clerk_user_id
        if (!clerkUserId) break

        await clerk.users.updateUserMetadata(clerkUserId, {
          publicMetadata: {
            subscribed: false,
            stripe_subscription_status: 'canceled',
          },
        })
        console.log(`[SnapBid] User ${clerkUserId} subscription canceled`)
        break
      }

      default:
        // Unhandled event type — safe to ignore
        break
    }
  } catch (err: any) {
    console.error('[SnapBid] Error processing webhook event:', err.message)
    return NextResponse.json({ error: 'Internal error processing webhook' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
