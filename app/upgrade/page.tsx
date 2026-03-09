'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

const FOUNDER_SPOTS_TOTAL = 50

const FEATURES = [
  { icon: '⚡', label: 'Unlimited quotes — no monthly cap' },
  { icon: '📄', label: 'Professional branded PDF exports' },
  { icon: '🎯', label: 'Calibrated to your exact rates & trade' },
  { icon: '📋', label: 'Quote history & win/loss tracking' },
  { icon: '📧', label: 'One-click email to clients' },
  { icon: '🔒', label: 'Founder price locked in forever — never increases' },
]

export default function UpgradePage() {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [spotsLeft, setSpotsLeft] = useState<number | null>(null)

  // Fetch real subscriber count from Stripe
  useEffect(() => {
    fetch('/api/founder-count')
      .then(r => r.json())
      .then(d => {
        if (d.count === null || d.count === undefined) {
          // Stripe not yet live — show honest "just launched" state
          setSpotsLeft(FOUNDER_SPOTS_TOTAL)
        } else {
          setSpotsLeft(Math.max(0, FOUNDER_SPOTS_TOTAL - d.count))
        }
      })
      .catch(() => setSpotsLeft(FOUNDER_SPOTS_TOTAL))
  }, [])

  const displaySpotsLeft = spotsLeft ?? FOUNDER_SPOTS_TOTAL

  const handleUpgrade = async () => {
    if (!user) {
      router.push('/sign-in')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start checkout')
      if (data.url) window.location.href = data.url
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const spotsPercent = Math.round((displaySpotsLeft / FOUNDER_SPOTS_TOTAL) * 100)

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Founder pricing banner */}
      <div className="bg-amber-500 text-white text-center py-2 px-4 text-sm font-semibold">
        🔥 Founder Pricing — First {FOUNDER_SPOTS_TOTAL} users get $9/mo locked in forever. Price goes to $19 after that.
      </div>

      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center gap-2.5">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center shadow-sm shadow-blue-200">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M9 1L3 9h5l-1 6 7-10H9V1z" fill="white" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-semibold text-gray-900 text-[17px] tracking-tight">SnapBid</span>
          </button>
        </div>
      </header>

      {/* Main */}
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-12 sm:py-20">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full border border-amber-200">
            ⭐ Founder Pricing — First {FOUNDER_SPOTS_TOTAL} users only
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center leading-tight mb-3">
          Win more jobs.<br />
          <span className="text-[#2563EB]">Quote in seconds.</span>
        </h1>
        <p className="text-gray-500 text-center text-base leading-relaxed mb-10">
          Join as a founding member and lock in $9/mo forever — before we open to the public at $19.
        </p>

        {/* Spots progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>Just launched</span>
            <span className="font-semibold text-amber-600">{displaySpotsLeft} of {FOUNDER_SPOTS_TOTAL} spots available</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-amber-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(4, 100 - spotsPercent)}%` }}
            />
          </div>
        </div>

        {/* Pricing Card */}
        <div className="bg-white rounded-2xl border-2 border-amber-400 shadow-md overflow-hidden mb-6">
          {/* Price block */}
          <div className="bg-[#2563EB] px-8 py-8 text-center relative">
            {/* Was $19 badge */}
            <div className="absolute top-4 right-4 bg-white/20 text-white/80 text-xs px-2 py-0.5 rounded-full line-through">
              $19/mo
            </div>
            <div className="flex items-baseline justify-center gap-1 mb-1">
              <span className="text-white/70 text-lg font-medium">$</span>
              <span className="text-5xl font-bold text-white">9</span>
              <span className="text-white/70 text-lg font-medium">/mo</span>
            </div>
            <p className="text-blue-100 text-sm mt-1">Locked in forever · Cancel anytime</p>
          </div>

          {/* Features */}
          <div className="px-8 py-7">
            <ul className="space-y-4 mb-8">
              {FEATURES.map(f => (
                <li key={f.label} className="flex items-center gap-3">
                  <span className="text-lg leading-none">{f.icon}</span>
                  <span className="text-sm text-gray-700">{f.label}</span>
                </li>
              ))}
            </ul>

            {/* CTA Button */}
            <button
              onClick={handleUpgrade}
              disabled={loading || !isLoaded}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-70 text-white font-semibold py-3.5 rounded-xl transition-colors text-base shadow-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Redirecting to checkout…
                </>
              ) : (
                <>
                  🔥 {user ? `Claim Founder Spot — $9/mo` : 'Sign in to Claim Your Spot'}
                </>
              )}
            </button>

            {error && (
              <p className="mt-3 text-sm text-red-500 text-center">{error}</p>
            )}

            <p className="text-center text-xs text-gray-400 mt-4">
              Secured by Stripe · Cancel anytime · Price never increases for you
            </p>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Back to SnapBid
          </button>
        </div>
      </div>
    </div>
  )
}
