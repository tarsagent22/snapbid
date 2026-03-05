'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

const FEATURES = [
  { icon: '⚡', label: 'Unlimited quotes — no monthly cap' },
  { icon: '📄', label: 'Professional branded PDF exports' },
  { icon: '🎯', label: 'Calibrated to your exact rates & trade' },
  { icon: '📋', label: 'Quote history & win/loss tracking' },
  { icon: '📧', label: 'One-click email to clients' },
  { icon: '🏢', label: 'Full contractor profile setup' },
]

export default function UpgradePage() {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
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
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-16 sm:py-24">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full border border-blue-100">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M9 1L3 9h5l-1 6 7-10H9V1z" fill="#2563EB"/>
            </svg>
            SnapBid Pro
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center leading-tight mb-3">
          Win more jobs.<br />
          <span className="text-[#2563EB]">Quote in seconds.</span>
        </h1>
        <p className="text-gray-500 text-center text-base leading-relaxed mb-10">
          Professional quotes calibrated to your trade, rates, and region — unlimited.
        </p>

        {/* Pricing Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          {/* Price block */}
          <div className="bg-[#2563EB] px-8 py-8 text-center">
            <div className="flex items-baseline justify-center gap-1 mb-1">
              <span className="text-white/70 text-lg font-medium">$</span>
              <span className="text-5xl font-bold text-white">19</span>
              <span className="text-white/70 text-lg font-medium">/mo</span>
            </div>
            <p className="text-blue-100 text-sm mt-1">Cancel anytime · No contracts</p>
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
              className="w-full bg-[#2563EB] hover:bg-blue-700 disabled:opacity-70 text-white font-semibold py-3.5 rounded-xl transition-colors text-base shadow-sm shadow-blue-200 flex items-center justify-center gap-2"
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
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  {user ? 'Upgrade Now — $19/mo' : 'Sign in to Upgrade'}
                </>
              )}
            </button>

            {error && (
              <p className="mt-3 text-sm text-red-500 text-center">{error}</p>
            )}

            <p className="text-center text-xs text-gray-400 mt-4">
              Secured by Stripe · Cancel anytime from your account
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
