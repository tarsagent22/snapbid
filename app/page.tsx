'use client'

import { useState, useEffect } from 'react'
import { useUser, UserButton, SignInButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

const TRADE_CHIPS = [
  { label: 'Plumber', value: 'plumbing' },
  { label: 'Electrician', value: 'electrical' },
  { label: 'General Contractor', value: 'general' },
  { label: 'Roofer', value: 'roofing' },
  { label: 'Painter', value: 'painting' },
  { label: 'HVAC', value: 'hvac' },
]

const EXAMPLE_PROMPTS = [
  'Install new bathroom vanity and replace shut-off valves',
  'Repair roof shingles on a 2-story house, approx 800 sq ft',
  'Wire 3 new outlets in garage and install a 20-amp circuit',
]

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
  const [lineItemOverrides] = useState<Record<number, string>>({})
  const [copied, setCopied] = useState(false)
  const [descCount, setDescCount] = useState(0)

  useEffect(() => {
    if (user) {
      fetch('/api/profile')
        .then(r => r.json())
        .then(data => {
          if (data.profile) {
            setProfile(data.profile)
            setForm(f => ({ ...f, businessName: data.profile.businessName, trade: data.profile.trade }))
          } else {
            router.push('/profile')
          }
        })
    }
  }, [user, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (e.target.name === 'jobDescription') setDescCount(e.target.value.length)
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
      setError('Couldn\'t generate the quote. Try describing the job with more detail.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyQuote = () => {
    if (!quote) return
    const lines = quote.lineItems?.map((item: any, i: number) =>
      `  ${item.description}: $${lineItemOverrides[i] ?? item.total}`
    ).join('\n') ?? ''
    const text = `QUOTE #${quote.quoteNumber}\nClient: ${form.clientName}\nAddress: ${form.clientAddress}\n\n${lines}\n\nSubtotal: $${quote.subtotal}\nTax: $${quote.tax}\nTOTAL: $${quote.total}\n\nPowered by SnapBid • snapbid.app`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleDownloadPDF = async () => {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ unit: 'pt', format: 'letter' })
    const biz = profile?.businessName || form.businessName
    const trade = profile?.trade || form.trade
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    const pageW = doc.internal.pageSize.getWidth()
    const margin = 48
    const contentW = pageW - margin * 2
    let y = margin

    doc.setFillColor(37, 99, 235)
    doc.rect(0, 0, pageW, 72, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text(biz, margin, 36)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.text(trade ? trade.charAt(0).toUpperCase() + trade.slice(1) + ' Services' : '', margin, 54)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text(`Quote ${quote.quoteNumber}`, pageW - margin, 32, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(date, pageW - margin, 48, { align: 'right' })
    doc.text(`Valid for ${profile?.quoteValidityDays || 30} days`, pageW - margin, 62, { align: 'right' })
    y = 96

    doc.setFillColor(249, 250, 251)
    doc.roundedRect(margin, y, contentW, 56, 4, 4, 'F')
    doc.setTextColor(107, 114, 128)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('PREPARED FOR', margin + 12, y + 16)
    doc.setTextColor(17, 24, 39)
    doc.setFontSize(12)
    doc.text(form.clientName, margin + 12, y + 32)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(107, 114, 128)
    doc.text(form.clientAddress, margin + 12, y + 46)
    y += 72

    doc.setFillColor(243, 244, 246)
    doc.rect(margin, y, contentW, 22, 'F')
    doc.setTextColor(107, 114, 128)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('DESCRIPTION', margin + 8, y + 15)
    doc.text('QTY', margin + contentW * 0.62, y + 15, { align: 'right' })
    doc.text('UNIT PRICE', margin + contentW * 0.78, y + 15, { align: 'right' })
    doc.text('TOTAL', margin + contentW, y + 15, { align: 'right' })
    y += 22

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    ;(quote.lineItems || []).forEach((item: any, i: number) => {
      if (i % 2 === 1) { doc.setFillColor(249, 250, 251); doc.rect(margin, y, contentW, 24, 'F') }
      doc.setTextColor(55, 65, 81)
      const descLines = doc.splitTextToSize(item.description, contentW * 0.55)
      doc.text(descLines, margin + 8, y + 16)
      doc.setTextColor(107, 114, 128)
      doc.text(String(item.qty), margin + contentW * 0.62, y + 16, { align: 'right' })
      doc.text(`$${item.unitPrice}`, margin + contentW * 0.78, y + 16, { align: 'right' })
      doc.setTextColor(17, 24, 39)
      doc.setFont('helvetica', 'bold')
      doc.text(`$${lineItemOverrides[i] ?? item.total}`, margin + contentW, y + 16, { align: 'right' })
      doc.setFont('helvetica', 'normal')
      y += Math.max(24, descLines.length * 14)
    })

    doc.setDrawColor(229, 231, 235)
    doc.line(margin, y + 4, pageW - margin, y + 4)
    y += 16
    const totalsX = pageW - margin - 200
    doc.setTextColor(107, 114, 128)
    doc.setFontSize(10)
    doc.text('Subtotal', totalsX, y + 14)
    doc.text(`$${quote.subtotal}`, pageW - margin, y + 14, { align: 'right' })
    doc.text('Tax (est.)', totalsX, y + 30)
    doc.text(`$${quote.tax}`, pageW - margin, y + 30, { align: 'right' })
    doc.setDrawColor(229, 231, 235)
    doc.line(totalsX, y + 36, pageW - margin, y + 36)
    doc.setTextColor(37, 99, 235)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text('TOTAL', totalsX, y + 52)
    doc.text(`$${quote.total}`, pageW - margin, y + 52, { align: 'right' })
    y += 72

    if (quote.notes) {
      doc.setFillColor(239, 246, 255)
      const noteLines = doc.splitTextToSize(quote.notes, contentW - 24)
      const noteH = noteLines.length * 14 + 28
      doc.roundedRect(margin, y, contentW, noteH, 4, 4, 'F')
      doc.setTextColor(29, 78, 216)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.text('NOTES', margin + 12, y + 16)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text(noteLines, margin + 12, y + 30)
      y += noteH + 16
    }

    doc.setDrawColor(229, 231, 235)
    doc.line(margin, y + 8, pageW - margin, y + 8)
    doc.setTextColor(156, 163, 175)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Generated by SnapBid · AI-powered quotes for contractors · snapbid.app', pageW / 2, y + 22, { align: 'center' })
    doc.save(`snapbid-quote-${form.clientName.replace(/\s+/g, '-')}.pdf`)
  }

  // ─── Input / label shared styles ──────────────────────────────────────────
  const inp = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 bg-white transition-all duration-150"
  const lbl = "block text-sm font-medium text-gray-700 mb-1.5"

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center shadow-sm shadow-blue-200">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M9 1L3 9h5l-1 6 7-10H9V1z" fill="white" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-semibold text-gray-900 text-[17px] tracking-tight">SnapBid</span>
          </div>

          {/* Nav / auth */}
          <div className="flex items-center gap-3">
            {isLoaded && (
              user ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => router.push('/profile')}
                    className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"></span>
                    {profile?.businessName || 'My Profile'}
                  </button>
                  <UserButton />
                </div>
              ) : (
                <SignInButton mode="modal" forceRedirectUrl="/profile">
                  <button className="text-sm bg-[#2563EB] hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm shadow-blue-200">
                    Sign In
                  </button>
                </SignInButton>
              )
            )}
          </div>
        </div>
      </header>

      {/* ── PROFILE CALIBRATION BAR (signed-in) ────────────────────────────── */}
      {profile && (
        <div className="bg-[#2563EB]/5 border-b border-[#2563EB]/10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-blue-700 font-medium">⚡ Calibrated to {profile.businessName}</span>
              <span className="hidden sm:inline text-blue-300 text-xs">·</span>
              <span className="hidden sm:inline text-xs text-blue-500">${profile.hourlyRate}/hr · {profile.materialTier} materials · {profile.region}</span>
            </div>
            <button onClick={() => router.push('/profile')} className="text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap transition-colors">
              Edit profile →
            </button>
          </div>
        </div>
      )}

      {/* ── HERO (guest only) ───────────────────────────────────────────────── */}
      {isLoaded && !user && !quote && (
        <div className="relative overflow-hidden bg-white border-b border-gray-100">
          {/* Dot grid background */}
          <div className="absolute inset-0 dot-grid opacity-60" />
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-blue-100">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M5.5 0.5L1.5 5.5h3l-.5 4 4.5-6H5.5V0.5z" fill="#2563EB"/>
              </svg>
              AI-powered · Built for tradespeople
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight mb-4 leading-[1.1]">
              Professional quotes<br />
              <span className="text-[#2563EB]">in 60 seconds</span>
            </h1>
            <p className="text-gray-500 text-lg sm:text-xl max-w-xl mx-auto mb-8 leading-relaxed">
              Describe the job in plain English. SnapBid generates accurate, itemized quotes calibrated to your rates.
            </p>
            <SignInButton mode="modal" forceRedirectUrl="/profile">
              <button className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors shadow-lg shadow-blue-200 text-sm">
                Get started free
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7h12M8 3l5 4-5 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </SignInButton>
            <p className="text-xs text-gray-400 mt-3">No credit card required · 3 free quotes</p>

            {/* How it works */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-14 text-left">
              {[
                { step: '01', title: 'Describe the job', desc: 'Enter client info and describe the work in plain language — no jargon needed.' },
                { step: '02', title: 'AI builds the quote', desc: 'Itemized line items, materials, labor, and totals — calibrated to your rates.' },
                { step: '03', title: 'Download or copy', desc: 'Professional PDF ready to send. Impress clients, close more jobs.' },
              ].map(item => (
                <div key={item.step} className="bg-white rounded-2xl border border-gray-100 px-6 py-5 shadow-sm">
                  <p className="text-[11px] font-bold text-[#2563EB] tracking-widest mb-3">{item.step}</p>
                  <p className="text-sm font-semibold text-gray-900 mb-1.5">{item.title}</p>
                  <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {!quote ? (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

            {/* ── FORM (left / full width on mobile) ── */}
            <div className="lg:col-span-3">
              {/* Section header */}
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-gray-900">
                  {profile ? `Quote for ${profile.businessName}` : 'Generate a Quote'}
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  {profile ? 'Calibrated to your rates — describe the job and go.' : 'Fill in the details and we\'ll handle the math.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Business + Trade (guests only) */}
                {!profile && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Your Business</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={lbl}>Business Name</label>
                        <input name="businessName" value={form.businessName} onChange={handleChange}
                          placeholder="Mike's Plumbing LLC" required className={inp} />
                      </div>
                      <div>
                        <label className={lbl}>Trade</label>
                        <select name="trade" value={form.trade} onChange={handleChange} required className={inp}>
                          <option value="">Select trade…</option>
                          {['plumbing','electrical','painting','landscaping','hvac','roofing','carpentry','flooring','general','handyman','cleaning','other'].map(t => (
                            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                          ))}
                        </select>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {TRADE_CHIPS.map(c => (
                            <button key={c.value} type="button"
                              onClick={() => setForm(f => ({ ...f, trade: c.value }))}
                              className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                                form.trade === c.value
                                  ? 'bg-[#2563EB] border-[#2563EB] text-white shadow-sm'
                                  : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600'
                              }`}>
                              {c.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Client info */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Client</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={lbl}>Client Name</label>
                      <input name="clientName" value={form.clientName} onChange={handleChange}
                        placeholder="John Smith" required className={inp} />
                    </div>
                    <div>
                      <label className={lbl}>Job Address</label>
                      <input name="clientAddress" value={form.clientAddress} onChange={handleChange}
                        placeholder="123 Main St, Austin TX" required className={inp} />
                    </div>
                  </div>
                </div>

                {/* Job description */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Job Description</p>
                  <div>
                    <textarea name="jobDescription" value={form.jobDescription} onChange={handleChange}
                      placeholder="Describe the job in plain English…"
                      required rows={4}
                      className={`${inp} resize-none`} />
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex gap-1.5 flex-wrap">
                        {EXAMPLE_PROMPTS.map((p, i) => (
                          <button key={i} type="button"
                            onClick={() => { setForm(f => ({ ...f, jobDescription: p })); setDescCount(p.length) }}
                            className="text-[11px] text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md transition-colors">
                            {p.split(' ').slice(0, 4).join(' ')}…
                          </button>
                        ))}
                      </div>
                      <span className={`text-xs tabular-nums flex-shrink-0 ml-2 ${descCount > 450 ? 'text-orange-400' : 'text-gray-300'}`}>
                        {descCount}/500
                      </span>
                    </div>
                  </div>
                </div>

                {/* Material tier */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Material Quality</p>
                    {profile && <span className="text-xs text-gray-400">default: {profile.materialTier}</span>}
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { value: 'budget', icon: '💰', label: 'Budget', sub: 'Lower cost' },
                      { value: 'standard', icon: '⚡', label: 'Standard', sub: 'Most jobs' },
                      { value: 'premium', icon: '💎', label: 'Premium', sub: 'High-end' },
                    ].map(tier => {
                      const active = form.materialTierOverride === tier.value ||
                        (!form.materialTierOverride && profile?.materialTier === tier.value)
                      return (
                        <button key={tier.value} type="button"
                          onClick={() => setForm(f => ({ ...f, materialTierOverride: f.materialTierOverride === tier.value ? '' : tier.value }))}
                          className={`relative p-3 rounded-xl border-2 text-center transition-all duration-150 ${
                            active
                              ? 'border-[#2563EB] bg-blue-50 shadow-sm'
                              : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                          }`}>
                          <div className="text-lg mb-0.5">{tier.icon}</div>
                          <div className={`text-xs font-semibold ${active ? 'text-[#2563EB]' : 'text-gray-700'}`}>{tier.label}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5">{tier.sub}</div>
                          {active && <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#2563EB]" />}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full relative overflow-hidden bg-[#2563EB] hover:bg-blue-700 disabled:opacity-70 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 text-sm shadow-md shadow-blue-200 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                        <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Building your quote…
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M7.5 1L2 7.5h4l-1 5.5L13 5.5H9.5V1H7.5z" fill="white"/>
                      </svg>
                      Generate Quote
                    </>
                  )}
                </button>

                {!user && (
                  <p className="text-center text-xs text-gray-400">
                    <SignInButton mode="modal" forceRedirectUrl="/profile">
                      <span className="text-[#2563EB] hover:underline cursor-pointer font-medium">Sign in free</span>
                    </SignInButton>
                    {' '}to save your rates and get accurate quotes every time
                  </p>
                )}
              </form>
            </div>

            {/* ── SIDEBAR: Quote placeholder + How it works ── */}
            <div className="lg:col-span-2 space-y-5">
              {/* Quote placeholder */}
              <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-8 flex flex-col items-center justify-center text-center min-h-[220px]">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-3">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M6 7h8M6 10h6M6 13h4M4 3h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z"
                      stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-400">Your quote will appear here</p>
                <p className="text-xs text-gray-300 mt-1">Complete the form and hit Generate</p>
              </div>

              {/* How it works — signed-in users only (guests see it in hero) */}
              {user && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">How it works</p>
                  {[
                    { n: '01', t: 'Describe the job', d: 'Plain English, no jargon.' },
                    { n: '02', t: 'AI builds the quote', d: 'Line items, pricing, totals — instantly.' },
                    { n: '03', t: 'Download PDF', d: 'Professional. Ready to send.' },
                  ].map(s => (
                    <div key={s.n} className="flex items-start gap-3">
                      <span className="text-[11px] font-bold text-[#2563EB] w-6 pt-0.5">{s.n}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{s.t}</p>
                        <p className="text-xs text-gray-400">{s.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Sign-in nudge for guests */}
              {!user && isLoaded && (
                <div className="bg-gradient-to-br from-[#2563EB] to-blue-700 rounded-2xl p-5 text-white">
                  <p className="font-semibold text-sm mb-1">Get calibrated quotes</p>
                  <p className="text-blue-200 text-xs mb-4 leading-relaxed">Sign in once to set your hourly rate, markup, and region. Every quote auto-adjusts to your numbers.</p>
                  <SignInButton mode="modal" forceRedirectUrl="/profile">
                    <button className="w-full bg-white text-[#2563EB] font-semibold py-2 rounded-lg text-sm hover:bg-blue-50 transition-colors">
                      Create free account →
                    </button>
                  </SignInButton>
                </div>
              )}
            </div>
          </div>

        ) : (

          /* ── QUOTE RESULT ──────────────────────────────────────────────── */
          <div className="animate-fade-in-up max-w-3xl mx-auto">
            {/* Success header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Quote Ready</h2>
                  <p className="text-xs text-gray-400">#{quote.quoteNumber}</p>
                </div>
              </div>
              <button onClick={() => setQuote(null)}
                className="text-sm text-gray-400 hover:text-gray-700 flex items-center gap-1.5 transition-colors">
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                </svg>
                New quote
              </button>
            </div>

            {/* Quote card */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm mb-4">
              {/* Card header */}
              <div className="bg-[#2563EB] px-8 py-6 flex justify-between items-start">
                <div>
                  <h3 className="text-white font-bold text-xl tracking-tight">
                    {profile?.businessName || form.businessName}
                  </h3>
                  <p className="text-blue-200 text-sm mt-0.5 capitalize">
                    {(profile?.trade || form.trade)} Services
                  </p>
                  {(profile?.phone || profile?.email) && (
                    <p className="text-blue-200 text-xs mt-2 space-x-3">
                      {profile?.phone && <span>{profile.phone}</span>}
                      {profile?.email && <span>{profile.email}</span>}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-blue-200 text-xs font-medium uppercase tracking-wide">Quote</p>
                  <p className="text-white font-bold text-lg mt-0.5">{quote.quoteNumber}</p>
                  <p className="text-blue-200 text-xs mt-1">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  <p className="text-blue-200 text-xs">Valid {profile?.quoteValidityDays || 30} days</p>
                </div>
              </div>

              <div className="px-8 py-6 space-y-6">
                {/* Bill to */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Prepared For</p>
                  <p className="font-semibold text-gray-900">{form.clientName}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{form.clientAddress}</p>
                </div>

                {/* Line items — desktop */}
                <div className="hidden md:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-100">
                        <th className="text-left pb-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Description</th>
                        <th className="text-right pb-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide w-16">Qty</th>
                        <th className="text-right pb-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide w-24">Unit</th>
                        <th className="text-right pb-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide w-24">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quote.lineItems?.map((item: any, i: number) => (
                        <tr key={i} className="border-b border-gray-50 group">
                          <td className="py-3 text-gray-700 pr-4">{item.description}</td>
                          <td className="py-3 text-right text-gray-400 tabular-nums">{item.qty}</td>
                          <td className="py-3 text-right text-gray-400 tabular-nums">${item.unitPrice}</td>
                          <td className="py-3 text-right font-semibold text-gray-900 tabular-nums">${lineItemOverrides[i] ?? item.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Line items — mobile */}
                <div className="md:hidden space-y-2">
                  {quote.lineItems?.map((item: any, i: number) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3.5">
                      <p className="text-sm font-medium text-gray-800 mb-2">{item.description}</p>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Qty {item.qty} × ${item.unitPrice}</span>
                        <span className="font-semibold text-gray-900">${lineItemOverrides[i] ?? item.total}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="flex justify-end pt-2">
                  <div className="w-56 space-y-2 text-sm">
                    <div className="flex justify-between text-gray-500">
                      <span>Subtotal</span><span className="tabular-nums">${quote.subtotal}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Tax (est.)</span><span className="tabular-nums">${quote.tax}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base pt-2.5 border-t-2 border-gray-100">
                      <span>Total</span>
                      <span className="text-[#2563EB] tabular-nums">${quote.total}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {quote.notes && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1.5">Notes</p>
                    <p className="text-sm text-blue-800 leading-relaxed">{quote.notes}</p>
                  </div>
                )}

                {/* Footer */}
                <p className="text-center text-xs text-gray-300 pt-2 border-t border-gray-50">
                  Powered by SnapBid · snapbid.app
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button onClick={handleDownloadPDF}
                className="flex-1 flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold py-3 px-5 rounded-xl transition-colors text-sm shadow-md shadow-blue-200">
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                Download PDF
              </button>
              <button onClick={handleCopyQuote}
                className="flex-1 flex items-center justify-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-5 rounded-xl transition-all text-sm">
                {copied ? (
                  <><svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg> Copied!</>
                ) : (
                  <><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth={2}/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeWidth={2}/></svg> Copy Summary</>
                )}
              </button>
              <button onClick={() => setQuote(null)}
                className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 font-medium py-3 px-4 rounded-xl transition-colors text-sm">
                New
              </button>
            </div>

            {!user && (
              <p className="text-center text-xs text-gray-400 mt-4">
                <SignInButton mode="modal" forceRedirectUrl="/profile">
                  <span className="text-[#2563EB] hover:underline cursor-pointer font-medium">Sign in free</span>
                </SignInButton>
                {' '}to calibrate quotes to your exact rates every time
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
