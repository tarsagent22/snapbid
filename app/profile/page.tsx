'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'

const TRADES = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'painting', label: 'Painting' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'roofing', label: 'Roofing' },
  { value: 'carpentry', label: 'Carpentry' },
  { value: 'flooring', label: 'Flooring' },
  { value: 'concrete', label: 'Concrete / Masonry' },
  { value: 'drywall', label: 'Drywall / Plastering' },
  { value: 'insulation', label: 'Insulation' },
  { value: 'windows-doors', label: 'Windows & Doors' },
  { value: 'general', label: 'General Contractor' },
  { value: 'handyman', label: 'Handyman' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'other', label: 'Other' },
]

const REGIONS = [
  { value: 'northeast', label: 'Northeast (NY, NJ, CT, MA…)' },
  { value: 'southeast', label: 'Southeast (FL, GA, NC, SC…)' },
  { value: 'midwest', label: 'Midwest (IL, OH, MI…)' },
  { value: 'southwest', label: 'Southwest (TX, AZ, NM…)' },
  { value: 'west', label: 'West (CA, WA, OR…)' },
  { value: 'mountain', label: 'Mountain (CO, UT, NV…)' },
  { value: 'national', label: 'Other / National average' },
]

const PAYMENT_TERMS = [
  { value: '50-deposit', label: '50% deposit, balance on completion' },
  { value: '30-deposit', label: '30% deposit, balance on completion' },
  { value: 'on-completion', label: 'Full payment on completion' },
  { value: 'net-15', label: 'Net 15 (invoice due in 15 days)' },
  { value: 'net-30', label: 'Net 30 (invoice due in 30 days)' },
  { value: 'full-upfront', label: 'Full payment upfront' },
  { value: 'custom', label: 'Custom (specify in notes)' },
]

const VALIDITY_OPTIONS = [
  { value: '7', label: '7 days' },
  { value: '14', label: '14 days' },
  { value: '30', label: '30 days (recommended)' },
  { value: '60', label: '60 days' },
  { value: '90', label: '90 days' },
]

const MOCK_LINE_ITEMS: Record<string, { description: string; qty: string; unitPrice: number; total: number }[]> = {
  plumbing: [
    { description: 'Labor – Replace bathroom faucet and supply lines', qty: '1.5 hrs', unitPrice: 95, total: 143 },
    { description: 'Delta faucet + braided supply lines (materials)', qty: '1', unitPrice: 165, total: 178 },
    { description: 'Shut-off valve replacement (×2)', qty: '2', unitPrice: 75, total: 150 },
  ],
  electrical: [
    { description: 'Labor – Install 3 new outlets in garage', qty: '3 hrs', unitPrice: 105, total: 315 },
    { description: '20-amp dedicated circuit installation', qty: '1', unitPrice: 250, total: 270 },
    { description: 'Wire, boxes, breaker, and hardware', qty: '1', unitPrice: 95, total: 103 },
  ],
  painting: [
    { description: 'Interior wall painting – living room', qty: '400 sq ft', unitPrice: 3.5, total: 1400 },
    { description: 'Primer coat', qty: '400 sq ft', unitPrice: 1.0, total: 400 },
    { description: 'Premium paint + supplies', qty: '1', unitPrice: 175, total: 189 },
  ],
  roofing: [
    { description: 'Tear-off and dispose of existing shingles', qty: '800 sq ft', unitPrice: 1.5, total: 1200 },
    { description: 'Install architectural asphalt shingles', qty: '800 sq ft', unitPrice: 5.0, total: 4000 },
    { description: 'Ridge cap, flashing, and underlayment', qty: '1', unitPrice: 350, total: 378 },
  ],
  hvac: [
    { description: 'Diagnostic service call', qty: '1', unitPrice: 125, total: 125 },
    { description: 'Refrigerant recharge (R-410A)', qty: '1 lb', unitPrice: 85, total: 92 },
    { description: 'Capacitor replacement', qty: '1', unitPrice: 175, total: 189 },
  ],
  carpentry: [
    { description: 'Build and install custom floating shelves', qty: '3 units', unitPrice: 185, total: 555 },
    { description: 'Labor – framing and finish carpentry', qty: '4 hrs', unitPrice: 70, total: 280 },
    { description: 'Lumber, brackets, and fasteners', qty: '1', unitPrice: 120, total: 130 },
  ],
  flooring: [
    { description: 'Hardwood floor installation', qty: '300 sq ft', unitPrice: 4.5, total: 1350 },
    { description: 'Subfloor prep and underlayment', qty: '300 sq ft', unitPrice: 1.0, total: 300 },
    { description: 'Engineered hardwood planks (material)', qty: '300 sq ft', unitPrice: 6.0, total: 1944 },
  ],
  landscaping: [
    { description: 'Lawn aeration and overseeding', qty: '2,500 sq ft', unitPrice: 0.12, total: 300 },
    { description: 'Mulch installation (3-inch depth)', qty: '4 yards', unitPrice: 75, total: 300 },
    { description: 'Shrub trimming and cleanup', qty: '2 hrs', unitPrice: 60, total: 120 },
  ],
  concrete: [
    { description: 'Pour and finish concrete driveway section', qty: '200 sq ft', unitPrice: 8.5, total: 1700 },
    { description: 'Rebar reinforcement', qty: '1', unitPrice: 250, total: 270 },
    { description: 'Form work and site prep', qty: '4 hrs', unitPrice: 75, total: 300 },
  ],
  drywall: [
    { description: 'Drywall installation', qty: '400 sq ft', unitPrice: 2.5, total: 1000 },
    { description: 'Tape, mud, and finish (3-coat)', qty: '400 sq ft', unitPrice: 1.5, total: 600 },
    { description: 'Materials – drywall sheets and compound', qty: '1', unitPrice: 220, total: 238 },
  ],
  cleaning: [
    { description: 'Deep clean – kitchen and bathrooms', qty: '1', unitPrice: 185, total: 185 },
    { description: 'Whole-home standard clean', qty: '1', unitPrice: 145, total: 145 },
    { description: 'Window cleaning (interior)', qty: '12 windows', unitPrice: 8, total: 96 },
  ],
  handyman: [
    { description: 'Assemble and mount furniture (×2 items)', qty: '2 hrs', unitPrice: 65, total: 130 },
    { description: 'Hang 6 pictures and patch 3 small holes', qty: '1.5 hrs', unitPrice: 65, total: 98 },
    { description: 'Hardware and fasteners', qty: '1', unitPrice: 25, total: 27 },
  ],
  general: [
    { description: 'Project labor – 2-person crew', qty: '8 hrs', unitPrice: 85, total: 680 },
    { description: 'Materials and supplies', qty: '1', unitPrice: 350, total: 378 },
    { description: 'Site cleanup and debris removal', qty: '1', unitPrice: 150, total: 162 },
  ],
}

const MOCK_SCOPE: Record<string, string> = {
  plumbing: 'Replace bathroom faucet, install new supply lines, and replace two aging shut-off valves to ensure reliable water flow and prevent future leaks.',
  electrical: 'Install three new 20-amp outlets in garage with a dedicated circuit, fully permitted and to code — ready for tools, EV charging, or workshop use.',
  painting: 'Prep, prime, and apply two coats of premium paint to all living room walls, including trim masking, cleanup, and furniture protection.',
  roofing: 'Remove existing shingles, install ice-and-water shield, new architectural shingles, ridge cap, and flashing to restore full weather protection.',
  hvac: 'Diagnose HVAC system, recharge refrigerant to manufacturer spec, and replace faulty run capacitor to restore full cooling performance.',
  carpentry: 'Design, build, and install three custom floating shelves with wall anchoring, level alignment, and a clean painted finish.',
  flooring: 'Install engineered hardwood flooring over prepped subfloor with proper underlayment, glue-down method, and finished transitions.',
  landscaping: 'Aerate, overseed, and mulch landscape beds to improve soil health, curb appeal, and seasonal growth.',
  general: 'Complete project labor including installation, site preparation, and full cleanup — leaving the job site clean and work ready for use.',
  cleaning: 'Deep clean all specified areas including kitchens, bathrooms, and interior windows with professional-grade products.',
  handyman: 'Assemble furniture, hang artwork, and complete minor repairs and patching with clean, precise results.',
  concrete: 'Form, pour, and finish a reinforced concrete section with proper slope, curing, and surface sealing.',
  drywall: 'Hang, tape, mud, and finish drywall to a smooth Level 5 surface ready for primer and paint.',
}

const MOCK_INCLUSIONS: Record<string, string[]> = {
  plumbing: ['All labor and new faucet hardware', 'Braided supply lines and shut-off valves', 'Site cleanup and debris removal', 'Testing for leaks before job closeout'],
  electrical: ['All wiring, conduit, and breaker installation', 'Dedicated 20-amp circuit to code', 'GFCI protection where required', 'Final circuit testing and cleanup'],
  general: ['All project labor', 'Materials as specified', 'Site cleanup and debris removal', 'Final walkthrough with client'],
}

const MOCK_EXCLUSIONS: Record<string, string[]> = {
  plumbing: ['Permits (if required by jurisdiction)', 'Drain or sewer work unless specified', 'Any hidden damage discovered during work'],
  electrical: ['Permit fees (estimated $150–$200 if required)', 'Panel upgrades unless separately scoped', 'Drywall repair after wire routing'],
  general: ['Permits unless noted', 'Work outside the described scope', 'Additional repairs if hidden damage is found'],
}

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)
  const [isNew, setIsNew] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null)

  const [form, setForm] = useState({
    // Core
    businessName: '',
    trade: 'general',
    region: 'national',
    // Pricing
    hourlyRate: '75',
    markup: '20',
    crewSize: '1',
    materialTier: 'standard',
    showMarkupOnQuote: false,
    // Contact
    phone: '',
    email: '',
    businessAddress: '',
    licenseNumber: '',
    yearsInBusiness: '',
    // Quote settings
    paymentTerms: '50-deposit',
    quoteValidityDays: '30',
    taxRate: '8.5',
    introMessage: '',
    notesTemplate: '',
    // Business mechanics
    minimumJobCharge: '',
    tripCharge: '',
    specialties: '',
  })

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => {
        if (data.profile) {
          const p = data.profile
          if (p.logoDataUrl) setLogoDataUrl(p.logoDataUrl)
          setForm({
            businessName: p.businessName || '',
            trade: p.trade || 'general',
            region: p.region || 'national',
            hourlyRate: String(p.hourlyRate || '75'),
            markup: String(p.markup || '20'),
            crewSize: String(p.crewSize || '1'),
            materialTier: p.materialTier || 'standard',
            showMarkupOnQuote: p.showMarkupOnQuote || false,
            phone: p.phone || '',
            email: p.email || '',
            businessAddress: p.businessAddress || '',
            licenseNumber: p.licenseNumber || '',
            yearsInBusiness: p.yearsInBusiness || '',
            paymentTerms: p.paymentTerms || '50-deposit',
            quoteValidityDays: String(p.quoteValidityDays || '30'),
            taxRate: String(p.taxRate || '8.5'),
            introMessage: p.introMessage || '',
            notesTemplate: p.notesTemplate || '',
            minimumJobCharge: p.minimumJobCharge ? String(p.minimumJobCharge) : '',
            tripCharge: p.tripCharge ? String(p.tripCharge) : '',
            specialties: p.specialties || '',
          })
        } else {
          setIsNew(true)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 512 * 1024) { alert('Logo must be under 512 KB.'); return }
    const reader = new FileReader()
    reader.onload = ev => setLogoDataUrl(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    setLogoDataUrl(null)
  }

  const handleSave = async () => {
    setSaving(true)
    const payload = {
      ...form,
      logoDataUrl: logoDataUrl || '',
    }
    await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    setSavedOk(true)
    setTimeout(() => {
      setSavedOk(false)
      router.push('/')
    }, 1200)
  }

  const mockQuote = useMemo(() => {
    const items = MOCK_LINE_ITEMS[form.trade] || MOCK_LINE_ITEMS.general
    const taxRate = parseFloat(form.taxRate) || 0
    const subtotal = items.reduce((sum, item) => sum + item.total, 0)
    const tax = taxRate > 0 ? Math.round(subtotal * (taxRate / 100)) : 0
    const total = subtotal + tax
    const tradeLabel = TRADES.find(t => t.value === form.trade)?.label || 'General'
    const paymentLabel = PAYMENT_TERMS.find(p => p.value === form.paymentTerms)?.label || form.paymentTerms
    const validityDays = parseInt(form.quoteValidityDays) || 30
    const validUntil = new Date(Date.now() + validityDays * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const notes = [`Payment terms: ${paymentLabel}.`, `This quote is valid until ${validUntil}.`, form.notesTemplate].filter(Boolean).join(' ')
    return {
      quoteNumber: 'SB-5291',
      businessName: form.businessName || 'Your Business Name',
      tradeLabel,
      phone: form.phone,
      email: form.email,
      lineItems: items,
      subtotal,
      tax,
      taxRate,
      total,
      scopeOfWork: MOCK_SCOPE[form.trade] || MOCK_SCOPE.general,
      inclusions: MOCK_INCLUSIONS[form.trade] || MOCK_INCLUSIONS.general,
      exclusions: MOCK_EXCLUSIONS[form.trade] || MOCK_EXCLUSIONS.general,
      notes,
    }
  }, [form])

  if (loading) {
    return (
      <main className="min-h-screen" style={{ background: 'var(--background)' }}>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400 text-sm">Loading your profile…</p>
        </div>
      </main>
    )
  }

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 bg-[#faf8f5] transition-all duration-150"
  const selectCls = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-[#faf8f5] transition-all duration-150"
  const labelCls = "block text-sm font-medium text-gray-700 mb-1.5"
  const sectionCls = "bg-[#faf8f5] rounded-2xl border border-gray-100 shadow-md p-6 space-y-5"
  const helperCls = "text-xs text-gray-400 mt-1"

  return (
    <main className="min-h-screen" style={{ background: 'var(--background)' }}>
      <header className="bg-[#faf8f5] border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3.5 flex items-center gap-3">
          <img src="/logo.svg" alt="SnapBid" className="h-9 w-auto" />
          <span className="text-gray-300">·</span>
          <span className="text-gray-400 text-sm">Your Profile</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-4">
        <button onClick={() => router.push('/')} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
          Back to quotes
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
            {isNew && (
              <div className="bg-gradient-to-r from-[#991b1b] to-[#b45309] rounded-2xl px-6 py-5 text-white">
                <p className="font-semibold text-base">👋 Welcome to SnapBid!</p>
                <p className="text-amber-100 text-sm mt-1 leading-relaxed">Set up your profile once and every quote will be calibrated to your business — your rates, your contact info, your terms.</p>
              </div>
            )}

            {/* ── SECTION 1: Business Identity ── */}
            <div className={sectionCls}>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Business Identity</p>
                <p className="text-sm text-gray-400 mt-1">Appears on every quote you send.</p>
              </div>

              <div>
                <label className={labelCls}>Business Name <span className="text-red-400">*</span></label>
                <input name="businessName" value={form.businessName} onChange={handleChange} placeholder="e.g. Mike's Plumbing LLC" className={inputCls} />
              </div>

              {/* Logo upload */}
              <div>
                <label className={labelCls}>Business Logo <span className="text-gray-400 font-normal">(optional)</span></label>
                <div className="flex items-center gap-4">
                  {logoDataUrl ? (
                    <div className="relative flex-shrink-0">
                      <img src={logoDataUrl} alt="Business logo" className="w-16 h-16 object-contain rounded-xl border border-gray-200 bg-gray-50 p-1" />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs leading-none hover:bg-red-600 transition-colors"
                        title="Remove logo"
                      >×</button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-gray-300">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                    </div>
                  )}
                  <div className="flex-1">
                    <label className="cursor-pointer inline-flex items-center gap-2 border border-gray-200 bg-[#faf8f5] hover:bg-gray-50 text-gray-600 text-sm font-medium px-4 py-2 rounded-xl transition-colors">
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                      </svg>
                      {logoDataUrl ? 'Replace logo' : 'Upload logo'}
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="sr-only" />
                    </label>
                    <p className="text-xs text-gray-400 mt-1.5">PNG or JPG · Max 512 KB · Appears on PDF quotes</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Your Trade</label>
                  <select name="trade" value={form.trade} onChange={handleChange} className={selectCls}>
                    {TRADES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Years in Business</label>
                  <input name="yearsInBusiness" type="number" min="0" max="99" value={form.yearsInBusiness} onChange={handleChange} placeholder="e.g. 8" className={inputCls} />
                  <p className={helperCls}>Shown on quotes as "X years of experience"</p>
                </div>
              </div>

              <div>
                <label className={labelCls}>License / Contractor Number <span className="text-gray-400 font-normal">(optional)</span></label>
                <input name="licenseNumber" value={form.licenseNumber} onChange={handleChange} placeholder="e.g. LIC #123456" className={inputCls} />
                <p className={helperCls}>Shown on quotes — builds trust with clients</p>
              </div>
            </div>

            {/* ── SECTION 2: Contact Info ── */}
            <div className={sectionCls}>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contact Information</p>
                <p className="text-sm text-gray-400 mt-1">Printed on every quote so clients can reach you.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Phone Number</label>
                  <input name="phone" value={form.phone} onChange={handleChange} placeholder="(555) 555-5555" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Business Email</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@yourbusiness.com" className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Business Address <span className="text-gray-400 font-normal">(optional)</span></label>
                <input name="businessAddress" value={form.businessAddress} onChange={handleChange} placeholder="123 Main St, City, State ZIP" className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Region</label>
                <select name="region" value={form.region} onChange={handleChange} className={selectCls}>
                  {REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <p className={helperCls}>Calibrates material and labor costs to your local market</p>
              </div>
            </div>

            {/* ── SECTION 3: Pricing Defaults ── */}
            <div className={sectionCls}>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pricing Defaults</p>
                <p className="text-sm text-gray-400 mt-1">Used to calculate every quote. You can override per job.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Your Hourly Rate ($/hr)</label>
                  <input name="hourlyRate" type="number" value={form.hourlyRate} onChange={handleChange} placeholder="75" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Markup on Materials (%)</label>
                  <input name="markup" type="number" value={form.markup} onChange={handleChange} placeholder="20" className={inputCls} />
                  <p className={helperCls}>Added on top of material costs</p>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.showMarkupOnQuote}
                      onChange={() => setForm(f => ({ ...f, showMarkupOnQuote: !f.showMarkupOnQuote }))}
                      className="w-3.5 h-3.5 rounded accent-[#991b1b]"
                    />
                    <span className="text-xs text-gray-500">Show markup line on client quote</span>
                  </label>
                </div>
                <div>
                  <label className={labelCls}>Tax Rate (%)</label>
                  <input name="taxRate" type="number" step="0.1" value={form.taxRate} onChange={handleChange} placeholder="8.5" className={inputCls} />
                  <p className={helperCls}>Applied to materials only. Set to 0 to exclude tax from quotes.</p>
                </div>
                <div>
                  <label className={labelCls}>Default Crew Size</label>
                  <select name="crewSize" value={form.crewSize} onChange={handleChange} className={selectCls}>
                    <option value="1">Solo (1 person)</option>
                    <option value="2">2-person crew</option>
                    <option value="3">3-person crew</option>
                    <option value="4">4+ person crew</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Default Material Quality</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'budget', label: 'Budget', desc: 'Lowest cost' },
                    { value: 'standard', label: 'Standard', desc: 'Mid-range' },
                    { value: 'premium', label: 'Premium', desc: 'High-end' },
                  ].map(tier => (
                    <button key={tier.value} type="button"
                      onClick={() => setForm({ ...form, materialTier: tier.value })}
                      className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 text-center ${
                        form.materialTier === tier.value
                          ? 'bg-[#991b1b] border-[#991b1b] text-white shadow-sm'
                          : 'border-gray-200 text-gray-600 hover:border-amber-400 hover:bg-amber-50'
                      }`}>
                      <div className="font-semibold">{tier.label}</div>
                      <div className={`text-xs mt-0.5 ${form.materialTier === tier.value ? 'text-amber-100' : 'text-gray-400'}`}>{tier.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── SECTION 4: Business Mechanics ── */}
            <div className={sectionCls}>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Business Mechanics</p>
                <p className="text-sm text-gray-400 mt-1">Helps the AI price jobs the way you actually work.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Minimum Job Charge ($)</label>
                  <input name="minimumJobCharge" type="number" value={form.minimumJobCharge} onChange={handleChange} placeholder="e.g. 150" className={inputCls} />
                  <p className={helperCls}>AI won't quote below this — protects you from underpricing small jobs</p>
                </div>
                <div>
                  <label className={labelCls}>Service / Trip Charge ($)</label>
                  <input name="tripCharge" type="number" value={form.tripCharge} onChange={handleChange} placeholder="e.g. 75" className={inputCls} />
                  <p className={helperCls}>Added automatically when a service call or travel fee applies</p>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Specialties <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input name="specialties" value={form.specialties} onChange={handleChange} placeholder="e.g. Tankless water heaters, copper re-pipes, hydro-jetting" className={inputCls} />
                  <p className={helperCls}>Helps the AI tailor quotes to your specific expertise</p>
                </div>
              </div>
            </div>

            {/* ── SECTION 6: Quote Settings ── */}
            <div className={sectionCls}>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Quote Settings</p>
                <p className="text-sm text-gray-400 mt-1">Control how your quotes look and what terms they include.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Payment Terms</label>
                  <select name="paymentTerms" value={form.paymentTerms} onChange={handleChange} className={selectCls}>
                    {PAYMENT_TERMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Quote Valid For</label>
                  <select name="quoteValidityDays" value={form.quoteValidityDays} onChange={handleChange} className={selectCls}>
                    {VALIDITY_OPTIONS.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Intro Message <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea name="introMessage" value={form.introMessage} onChange={handleChange}
                  placeholder="e.g. Thank you for choosing Mike's Plumbing! We take pride in quality work and transparent pricing."
                  rows={2} className={`${inputCls} resize-none`} />
                <p className={helperCls}>A personal note from your business — shown at the top of email quotes and woven naturally into quote language by the AI.</p>
              </div>

              <div>
                <label className={labelCls}>Default Quote Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea name="notesTemplate" value={form.notesTemplate} onChange={handleChange}
                  placeholder="e.g. All work is guaranteed for 1 year. Any unforeseen conditions (hidden damage, code upgrades) will be communicated before proceeding."
                  rows={3} className={`${inputCls} resize-none`} />
                <p className={helperCls}>Appended to the notes on every quote — warranties, disclaimers, anything you always include. AI adds job-specific notes on top of this.</p>
              </div>
            </div>

            {/* ── Save + Preview buttons ── */}
            <div className="flex gap-3">
              <button onClick={handleSave} disabled={saving || !form.businessName}
                className={`flex-1 font-semibold py-3 px-6 rounded-xl transition-all duration-200 text-sm min-h-[44px] shadow-sm ${
                  savedOk
                    ? 'bg-amber-600 text-white'
                    : 'bg-[#991b1b] hover:bg-red-800 disabled:bg-amber-400 text-white shadow-amber-200'
                }`}>
                {savedOk ? '✓ Saved!' : saving ? 'Saving…' : isNew ? 'Save Profile & Start Quoting →' : 'Update Profile'}
              </button>
              <button
                type="button"
                onClick={() => setShowPreview(v => !v)}
                className="flex items-center gap-1.5 border border-gray-200 bg-[#faf8f5] hover:bg-gray-50 text-gray-600 font-medium py-3 px-4 rounded-xl transition-colors text-sm">
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
                {showPreview ? 'Hide' : 'Preview'}
              </button>
            </div>

            {/* ── Preview Quote ── */}
            {showPreview && (
              <div className="bg-[#faf8f5] rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-50">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Quote Preview</p>
                  <p className="text-xs text-gray-400 mt-0.5">Example quote using your current profile settings. Updates as you edit.</p>
                </div>

                {/* Quote card header */}
                <div className="bg-[#1C1917] px-8 py-6 flex justify-between items-start">
                  <div>
                    <h3 className="text-white font-bold text-xl tracking-tight">{mockQuote.businessName}</h3>
                    <p className="text-stone-400 text-sm mt-0.5">{mockQuote.tradeLabel} Services</p>
                    {(mockQuote.phone || mockQuote.email) && (
                      <p className="text-stone-400 text-xs mt-2 space-x-3">
                        {mockQuote.phone && <span>{mockQuote.phone}</span>}
                        {mockQuote.email && <span>{mockQuote.email}</span>}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-stone-400 text-xs font-medium uppercase tracking-wide">Quote</p>
                    <p className="text-amber-500 font-bold text-lg mt-0.5">{mockQuote.quoteNumber}</p>
                    <p className="text-stone-400 text-xs mt-1">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>

                <div className="px-8 py-6 space-y-5">
                  {/* Prepared for */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Prepared For</p>
                    <p className="font-semibold text-gray-900">Sample Client</p>
                    <p className="text-sm text-gray-500 mt-0.5">123 Main St, Anytown, USA</p>
                  </div>

                  {/* Scope of work */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Scope of Work</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{mockQuote.scopeOfWork}</p>
                  </div>

                  {/* Line items */}
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
                      {mockQuote.lineItems.map((item, i) => (
                        <tr key={i} className="border-b border-gray-50">
                          <td className="py-3 text-gray-700 pr-4">{item.description}</td>
                          <td className="py-3 text-right text-gray-400 tabular-nums">{item.qty}</td>
                          <td className="py-3 text-right text-gray-400 tabular-nums">${item.unitPrice}</td>
                          <td className="py-3 text-right font-semibold text-gray-900 tabular-nums">${item.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals */}
                  <div className="flex justify-end">
                    <div className="w-56 space-y-2 text-sm">
                      <div className="flex justify-between text-gray-500">
                        <span>Subtotal</span><span className="tabular-nums">${mockQuote.subtotal.toLocaleString()}</span>
                      </div>
                      {mockQuote.tax > 0 && (
                        <div className="flex justify-between text-gray-500">
                          <span>Tax ({mockQuote.taxRate}%)</span><span className="tabular-nums">${mockQuote.tax.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-base pt-2.5 border-t-2 border-gray-100">
                        <span>Total</span>
                        <span className="text-[#991b1b] tabular-nums">${mockQuote.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Inclusions & Exclusions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                      <p className="text-[10px] font-bold text-red-700 uppercase tracking-widest mb-2">✓ What&apos;s Included</p>
                      <ul className="space-y-1.5">
                        {mockQuote.inclusions.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-red-800">
                            <svg className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                            </svg>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                      <p className="text-[10px] font-bold text-red-700 uppercase tracking-widest mb-2">⚠ Not Included</p>
                      <ul className="space-y-1.5">
                        {mockQuote.exclusions.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-red-800">
                            <svg className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Notes */}
                  {mockQuote.notes && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                      <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1.5">Notes</p>
                      <p className="text-sm text-red-800 leading-relaxed">{mockQuote.notes}</p>
                    </div>
                  )}

                  <p className="text-center text-xs text-gray-300 pt-2 border-t border-gray-50">
                    {mockQuote.businessName} · Professional Estimate
                  </p>
                </div>
              </div>
            )}
      </div>
    </main>
  )
}
