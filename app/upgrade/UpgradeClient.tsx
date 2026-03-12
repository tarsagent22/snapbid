'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

const FOUNDER_SPOTS_TOTAL = 50

const FEATURES = [
  { label: 'Unlimited quotes — no monthly cap' },
  { label: 'Professional branded PDF exports' },
  { label: 'Calibrated to your exact rates and trade' },
  { label: 'Quote history and win/loss tracking' },
  { label: 'One-click email and share to clients' },
  { label: 'All future features included' },
]

interface Props {
  initialSpotsLeft: number
}

export default function UpgradeClient({ initialSpotsLeft }: Props) {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [spotsLeft, setSpotsLeft] = useState<number>(initialSpotsLeft)

  useEffect(() => {
    fetch('/api/founder-count')
      .then(r => r.json())
      .then(d => {
        if (d.count !== null && d.count !== undefined) {
          setSpotsLeft(Math.max(0, FOUNDER_SPOTS_TOTAL - d.count))
        }
      })
      .catch(() => {})
  }, [])

  const handleCheckout = async () => {
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

  const spotsClaimed = FOUNDER_SPOTS_TOTAL - spotsLeft
  const spotsPercent = Math.round((spotsClaimed / FOUNDER_SPOTS_TOTAL) * 100)

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header className="bg-[#faf8f5] border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center gap-2.5">
          <button onClick={() => router.push('/')} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <img src="/logo.svg" alt="SnapBid" className="h-9 w-auto" />
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 sm:px-6 py-12 sm:py-20">

        {/* Headline */}
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 mb-3">Founder Pricing</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-3">
            Unlimited quotes. One flat rate.
          </h1>
          <p className="text-gray-500 text-base leading-relaxed max-w-md mx-auto">
            Lock in founder pricing before we go public at $19/mo.
          </p>
        </div>

        {/* Pricing card */}
        <div className="bg-[#faf8f5] rounded-2xl border-2 border-[#991b1b] shadow-lg overflow-hidden mb-6">
          <div className="bg-[#991b1b] px-8 py-5 text-center">
            <div className="flex items-baseline justify-center gap-1.5">
              <span className="text-4xl font-bold text-white">$9</span>
              <span className="text-white/70 text-base font-medium">/month</span>
            </div>
            <p className="text-amber-100 text-sm mt-1">Cancel anytime. Price locked forever.</p>
          </div>

          <div className="px-8 py-6">
            {/* Spots bar */}
            <div className="mb-6">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{spotsClaimed} of {FOUNDER_SPOTS_TOTAL} founder spots claimed</span>
                <span className="text-[#991b1b] font-medium">{spotsLeft} left</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div className="bg-[#991b1b] h-1.5 rounded-full transition-all" style={{ width: `${Math.max(4, spotsPercent)}%` }} />
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              {FEATURES.map(f => (
                <li key={f.label} className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-[#991b1b] flex items-center justify-center shrink-0">
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">{f.label}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={handleCheckout}
              disabled={loading || !isLoaded}
              className="w-full bg-[#991b1b] hover:bg-red-800 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors text-base flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Redirecting to checkout...</>
              ) : (
                user ? 'Claim Founder Spot — $9/mo' : 'Sign in to get started'
              )}
            </button>
            <p className="text-center text-xs text-gray-400 mt-3">Secured by Stripe</p>
          </div>
        </div>

        {error && <p className="text-sm text-red-500 text-center mb-4">{error}</p>}

        <div className="text-center">
          <button onClick={() => router.push('/')} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            Back to SnapBid
          </button>
        </div>
      </div>
    </div>
  )
}
