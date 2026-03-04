'use client'

import { useState, useEffect } from 'react'
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

const YEARS_OPTIONS = [
  { value: 'less-1', label: 'Less than 1 year' },
  { value: '1-3', label: '1–3 years' },
  { value: '3-5', label: '3–5 years' },
  { value: '5-10', label: '5–10 years' },
  { value: '10-20', label: '10–20 years' },
  { value: '20+', label: '20+ years' },
]

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)
  const [isNew, setIsNew] = useState(false)
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
    // Contact & identity
    phone: '',
    email: '',
    businessAddress: '',
    licenseNumber: '',
    yearsInBusiness: '1-3',
    specialties: '',
    // Quote settings
    paymentTerms: '50-deposit',
    quoteValidityDays: '30',
    introMessage: '',
  })

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => {
        if (data.profile) {
          const p = data.profile
          setForm({
            businessName: p.businessName || '',
            trade: p.trade || 'general',
            region: p.region || 'national',
            hourlyRate: String(p.hourlyRate || '75'),
            markup: String(p.markup || '20'),

            crewSize: String(p.crewSize || '1'),
            materialTier: p.materialTier || 'standard',
            phone: p.phone || '',
            email: p.email || '',
            businessAddress: p.businessAddress || '',
            licenseNumber: p.licenseNumber || '',
            yearsInBusiness: p.yearsInBusiness || '1-3',
            specialties: p.specialties || '',
            paymentTerms: p.paymentTerms || '50-deposit',
            quoteValidityDays: String(p.quoteValidityDays || '30'),
            introMessage: p.introMessage || '',
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

  const handleSave = async () => {
    setSaving(true)
    await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setSavedOk(true)
    setTimeout(() => {
      setSavedOk(false)
      router.push('/')
    }, 1200)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading your profile...</p>
      </main>
    )
  }

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 bg-white transition-all duration-150"
  const selectCls = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white transition-all duration-150"
  const labelCls = "block text-sm font-medium text-gray-700 mb-1.5"
  const sectionCls = "bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5"

  return (
    <main className="min-h-screen" style={{ background: 'var(--background)' }}>
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center shadow-sm shadow-blue-200 flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M9 1L3 9h5l-1 6 7-10H9V1z" fill="white" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-semibold text-gray-900 text-[17px] tracking-tight">SnapBid</span>
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
          <div className="bg-gradient-to-r from-[#2563EB] to-blue-700 rounded-2xl px-6 py-5 text-white">
            <p className="font-semibold text-base">👋 Welcome to SnapBid!</p>
            <p className="text-blue-100 text-sm mt-1 leading-relaxed">Set up your profile once and every quote will be calibrated to your business — your rates, your contact info, your terms.</p>
          </div>
        )}

        {/* Section 1: Business Identity */}
        <div className={sectionCls}>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Business Identity</p>
            <p className="text-sm text-gray-400 mt-1">Appears on every quote you send.</p>
          </div>

          <div>
            <label className={labelCls}>Business Name <span className="text-red-400">*</span></label>
            <input name="businessName" value={form.businessName} onChange={handleChange} placeholder="e.g. Mike's Plumbing LLC" className={inputCls} />
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
              <select name="yearsInBusiness" value={form.yearsInBusiness} onChange={handleChange} className={selectCls}>
                {YEARS_OPTIONS.map(y => <option key={y.value} value={y.value}>{y.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>License / Contractor Number <span className="text-gray-400 font-normal">(optional)</span></label>
            <input name="licenseNumber" value={form.licenseNumber} onChange={handleChange} placeholder="e.g. LIC #123456" className={inputCls} />
            <p className="text-xs text-gray-400 mt-1">Shown on quotes — builds trust and is required by many clients</p>
          </div>

          <div>
            <label className={labelCls}>Specialties <span className="text-gray-400 font-normal">(optional)</span></label>
            <input name="specialties" value={form.specialties} onChange={handleChange} placeholder="e.g. residential remodels, bathroom renovations, emergency repairs" className={inputCls} />
            <p className="text-xs text-gray-400 mt-1">Helps the AI write more targeted, accurate line items</p>
          </div>
        </div>

        {/* Section 2: Contact Info */}
        <div className={sectionCls}>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contact Information</p>
            <p className="text-sm text-gray-400 mt-1">Printed on every quote so clients can reach you directly.</p>
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
            <p className="text-xs text-gray-400 mt-1">Used to calibrate material and labor costs to your local market</p>
          </div>
        </div>

        {/* Section 3: Pricing */}
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
              <p className="text-xs text-gray-400 mt-1">Added on top of materials cost</p>
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
                <button
                  key={tier.value}
                  type="button"
                  onClick={() => setForm({ ...form, materialTier: tier.value })}
                  className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 text-center ${
                    form.materialTier === tier.value
                      ? 'bg-[#2563EB] border-[#2563EB] text-white shadow-sm'
                      : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <div className="font-semibold">{tier.label}</div>
                  <div className={`text-xs mt-0.5 ${form.materialTier === tier.value ? 'text-blue-100' : 'text-gray-400'}`}>{tier.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 4: Quote Settings */}
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
            <label className={labelCls}>Opening Message <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea
              name="introMessage"
              value={form.introMessage}
              onChange={handleChange}
              placeholder="e.g. Thank you for the opportunity to work on your project. We stand behind our work with a 1-year labor warranty."
              rows={3}
              className={`${inputCls} resize-none`}
            />
            <p className="text-xs text-gray-400 mt-1">Shown at the top of every quote — great for a brief pitch or warranty statement</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !form.businessName}
          className={`w-full font-semibold py-3 px-6 rounded-xl transition-all duration-200 text-sm min-h-[44px] ${
            savedOk
              ? 'bg-green-500 text-white'
              : 'bg-[#2563EB] hover:bg-blue-700 disabled:bg-blue-300 text-white'
          }`}
        >
          {savedOk ? '✓ Saved!' : saving ? 'Saving...' : isNew ? 'Save Profile & Start Quoting →' : 'Update Profile'}
        </button>
      </div>
    </main>
  )
}
