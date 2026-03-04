'use client'

import { useState } from 'react'

export default function Home() {
  const [form, setForm] = useState({
    businessName: '',
    trade: '',
    clientName: '',
    clientAddress: '',
    jobDescription: '',
    yourRate: '',
  })
  const [loading, setLoading] = useState(false)
  const [quote, setQuote] = useState<any>(null)
  const [error, setError] = useState('')

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
      body: JSON.stringify({ ...form, ...quote }),
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `quote-${form.clientName.replace(/\s+/g, '-')}.pdf`
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
          <span className="text-sm text-gray-500">AI-powered quotes in 60 seconds</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {!quote ? (
          <>
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Generate a Professional Quote</h1>
              <p className="text-gray-500">Describe the job — we&apos;ll handle the rest</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
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
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select your trade</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="electrical">Electrical</option>
                    <option value="painting">Painting</option>
                    <option value="landscaping">Landscaping</option>
                    <option value="hvac">HVAC</option>
                    <option value="roofing">Roofing</option>
                    <option value="carpentry">Carpentry</option>
                    <option value="flooring">Flooring</option>
                    <option value="general">General Contractor</option>
                    <option value="handyman">Handyman</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="other">Other</option>
                  </select>
                </div>
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
                  placeholder="e.g. Replace kitchen faucet and fix slow drain under sink. Customer also wants new shut-off valves installed."
                  required
                  rows={4}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Hourly Rate (optional)</label>
                <input
                  name="yourRate"
                  value={form.yourRate}
                  onChange={handleChange}
                  placeholder="e.g. 85"
                  type="number"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">Leave blank and we&apos;ll use market rates for your trade</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-sm"
              >
                {loading ? '✨ Generating your quote...' : '⚡ Generate Quote in 60 Seconds'}
              </button>
            </form>
          </>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Your Quote is Ready</h2>
              <button
                onClick={() => setQuote(null)}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                ← Start over
              </button>
            </div>

            {/* Quote Preview */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{form.businessName}</h3>
                  <p className="text-gray-500 text-sm mt-1 capitalize">{form.trade} Services</p>
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

              <div className="mb-6">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Scope of Work</p>

                {/* Desktop table */}
                <table className="w-full text-sm hidden md:table">
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

                {/* Mobile card layout */}
                <div className="md:hidden space-y-3">
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
              </div>

              <div className="flex justify-end">
                <div className="w-full max-w-xs space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600 py-1">
                    <span>Subtotal</span>
                    <span className="font-medium">${quote.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 py-1">
                    <span>Tax (est.)</span>
                    <span className="font-medium">${quote.tax}</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-200 pt-3 mt-1">
                    <span>Total</span>
                    <span className="text-blue-600">${quote.total}</span>
                  </div>
                </div>
              </div>

              {quote.notes && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-sm text-blue-800">{quote.notes}</p>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleDownloadPDF}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-sm"
              >
                📄 Download PDF Quote
              </button>
              <button
                onClick={() => setQuote(null)}
                className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors text-sm"
              >
                Generate Another Quote
              </button>
            </div>

            <p className="text-center text-xs text-gray-400">
              Want unlimited quotes + your logo on every PDF?{' '}
              <a href="https://snapbid.app" className="text-blue-600 underline">Upgrade to SnapBid Pro — $19/mo</a>
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
