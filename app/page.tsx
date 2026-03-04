'use client'

import { useState, useEffect } from 'react'
import { useUser, UserButton, SignInButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function Home() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [form, setForm] = useState({
    businessName: '',
    trade: '',
    clientName: '',
    clientAddress: '',
    jobDescription: '',
    materialTierOverride: '',
  })
  const [loading, setLoading] = useState(false)
  const [quote, setQuote] = useState<any>(null)
  const [error, setError] = useState('')

  // Load profile if logged in
  useEffect(() => {
    if (user) {
      fetch('/api/profile')
        .then(r => r.json())
        .then(data => {
          if (data.profile) {
            setProfile(data.profile)
            setForm(f => ({
              ...f,
              businessName: data.profile.businessName,
              trade: data.profile.trade,
            }))
          } else {
            // New user — send to profile setup
            router.push('/profile')
          }
        })
    }
  }, [user, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setQuote(null)

    try {
      const res = await fetch('/api/generate-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate quote')
      setQuote(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    const res = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, ...quote, businessName: profile?.businessName || form.businessName }),
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `snapbid-quote-${form.clientName.replace(/\s+/g, '-')}.html`
    a.click()
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-semibold text-gray-900 text-lg">SnapBid</span>
          </div>
          <div className="flex items-center gap-3">
            {isLoaded && (
              user ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => router.push('/profile')}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    {profile?.businessName || 'My Profile'}
                  </button>
                  <UserButton afterSignOutUrl="/" />
                </div>
              ) : (
                <SignInButton mode="modal" afterSignInUrl="/profile">
                  <button className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                    Sign In
                  </button>
                </SignInButton>
              )
            )}
          </div>
        </div>
      </header>

      {/* Profile summary bar (logged in users) */}
      {profile && (
        <div className="bg-blue-50 border-b border-blue-100">
          <div className="max-w-4xl mx-auto px-6 py-2 flex items-center justify-between">
            <p className="text-xs text-blue-700">
              ⚡ Quotes calibrated to <strong>{profile.businessName}</strong> · ${profile.hourlyRate}/hr · {profile.materialTier} materials · {profile.region} region
            </p>
            <button onClick={() => router.push('/profile')} className="text-xs text-blue-600 underline">Edit</button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 py-10">
        {!quote ? (
          <>
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Generate a Professional Quote</h1>
              <p className="text-gray-500">
                {profile ? 'Calibrated to your rates — describe the job and go.' : 'Describe the job — we\'ll handle the rest'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">

              {/* Only show business/trade fields if no profile */}
              {!profile && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Business Name</label>
                    <input
                      name="businessName"
                      value={form.businessName}
                      onChange={handleChange}
                      placeholder="e.g. Mike's Plumbing LLC"
                      required
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trade / Service Type</label>
                    <select
                      name="trade"
                      value={form.trade}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select your trade</option>
                      {['plumbing','electrical','painting','landscaping','hvac','roofing','carpentry','flooring','general','handyman','cleaning','other'].map(t => (
                        <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                  <input
                    name="clientName"
                    value={form.clientName}
                    onChange={handleChange}
                    placeholder="e.g. John Smith"
                    required
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Address</label>
                  <input
                    name="clientAddress"
                    value={form.clientAddress}
                    onChange={handleChange}
                    placeholder="e.g. 123 Main St, Austin TX"
                    required
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Describe the Job</label>
                <textarea
                  name="jobDescription"
                  value={form.jobDescription}
                  onChange={handleChange}
                  placeholder="e.g. Replace kitchen faucet and fix slow drain under sink. Customer wants new shut-off valves too."
                  required
                  rows={4}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Material tier override (quick tap) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Material Quality for This Job
                  {profile && <span className="text-gray-400 font-normal ml-1">(default: {profile.materialTier})</span>}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'budget', label: '💰 Budget', sub: 'Lower cost materials' },
                    { value: 'standard', label: '⚡ Standard', sub: 'Mid-range (most jobs)' },
                    { value: 'premium', label: '💎 Premium', sub: 'High-end materials' },
                  ].map(tier => (
                    <button
                      key={tier.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, materialTierOverride: f.materialTierOverride === tier.value ? '' : tier.value }))}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        (form.materialTierOverride === tier.value) ||
                        (!form.materialTierOverride && profile?.materialTier === tier.value)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-800">{tier.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{tier.sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-sm"
              >
                {loading ? '✨ Generating your quote...' : '⚡ Generate Quote'}
              </button>

              {!user && (
                <p className="text-center text-xs text-gray-400">
                  <SignInButton mode="modal" afterSignInUrl="/profile">
                    <span className="text-blue-600 underline cursor-pointer">Sign in free</span>
                  </SignInButton>
                  {' '}to save your rates and get accurate quotes every time
                </p>
              )}
            </form>
          </>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Your Quote is Ready</h2>
              <button onClick={() => setQuote(null)} className="text-sm text-gray-500 hover:text-gray-700 underline">← New quote</button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{profile?.businessName || form.businessName}</h3>
                  <p className="text-gray-500 text-sm mt-1 capitalize">{profile?.trade || form.trade} Services</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Quote #{quote.quoteNumber}</p>
                  <p className="text-sm text-gray-500">{new Date().toLocaleDateString()}</p>
                  <p className="text-xs text-gray-400 mt-1">Valid for 30 days</p>
                </div>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Prepared for</p>
                <p className="font-medium text-gray-900">{form.clientName}</p>
                <p className="text-gray-500 text-sm">{form.clientAddress}</p>
              </div>

              {/* Desktop table */}
              <table className="w-full text-sm hidden md:table mb-6">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 font-medium text-gray-700">Description</th>
                    <th className="text-right py-2 font-medium text-gray-700 w-20">Qty</th>
                    <th className="text-right py-2 font-medium text-gray-700 w-24">Unit Price</th>
                    <th className="text-right py-2 font-medium text-gray-700 w-24">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.lineItems?.map((item: any, i: number) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-3 text-gray-700">{item.description}</td>
                      <td className="py-3 text-right text-gray-500">{item.qty}</td>
                      <td className="py-3 text-right text-gray-500">${item.unitPrice}</td>
                      <td className="py-3 text-right font-medium text-gray-900">${item.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3 mb-6">
                {quote.lineItems?.map((item: any, i: number) => (
                  <div key={i} className="border border-gray-100 rounded-lg p-3">
                    <p className="text-sm text-gray-800 font-medium mb-2">{item.description}</p>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Qty: {item.qty}</span>
                      <span>@ ${item.unitPrice}</span>
                      <span className="font-semibold text-gray-900">${item.total}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end mb-6">
                <div className="w-full max-w-xs space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600 py-1">
                    <span>Subtotal</span><span className="font-medium">${quote.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 py-1">
                    <span>Tax (est.)</span><span className="font-medium">${quote.tax}</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-200 pt-3">
                    <span>Total</span><span className="text-blue-600">${quote.total}</span>
                  </div>
                </div>
              </div>

              {quote.notes && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-sm text-blue-800">{quote.notes}</p>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button onClick={handleDownloadPDF} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-sm">
                📄 Download Quote
              </button>
              <button onClick={() => setQuote(null)} className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors text-sm">
                New Quote
              </button>
            </div>

            {!user && (
              <p className="text-center text-xs text-gray-400">
                <SignInButton mode="modal" afterSignInUrl="/profile">
                  <span className="text-blue-600 underline cursor-pointer">Sign in free</span>
                </SignInButton>
                {' '}to save your rates — quotes calibrated to your business every time
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
