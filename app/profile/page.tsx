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
  { value: 'general', label: 'General Contractor' },
  { value: 'handyman', label: 'Handyman' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'other', label: 'Other' },
]

const REGIONS = [
  { value: 'northeast', label: 'Northeast (NY, NJ, CT, MA, etc.)' },
  { value: 'southeast', label: 'Southeast (FL, GA, NC, SC, etc.)' },
  { value: 'midwest', label: 'Midwest (IL, OH, MI, etc.)' },
  { value: 'southwest', label: 'Southwest (TX, AZ, NM, etc.)' },
  { value: 'west', label: 'West (CA, WA, OR, etc.)' },
  { value: 'mountain', label: 'Mountain (CO, UT, NV, etc.)' },
  { value: 'national', label: 'Other / National average' },
]

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isNew, setIsNew] = useState(false)
  const [form, setForm] = useState({
    businessName: '',
    trade: 'general',
    hourlyRate: '75',
    region: 'national',
    materialTier: 'standard',
    crewSize: '1',
    markup: '20',
  })

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => {
        if (data.profile) {
          setForm({
            businessName: data.profile.businessName,
            trade: data.profile.trade,
            hourlyRate: String(data.profile.hourlyRate),
            region: data.profile.region,
            materialTier: data.profile.materialTier,
            crewSize: String(data.profile.crewSize),
            markup: String(data.profile.markup),
          })
        } else {
          setIsNew(true)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
    router.push('/')
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading your profile...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="font-semibold text-gray-900 text-lg">SnapBid</span>
          <span className="text-gray-400">·</span>
          <span className="text-gray-500 text-sm">Your Profile</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10">
        {isNew && (
          <div className="mb-6 bg-blue-50 border border-blue-100 rounded-xl px-5 py-4">
            <p className="text-blue-800 font-medium text-sm">👋 Welcome to SnapBid!</p>
            <p className="text-blue-600 text-sm mt-1">Set up your profile once and every quote will be calibrated to your business — your rates, your materials, your region.</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Your Business</h2>
            <p className="text-sm text-gray-400 mb-5">This information anchors every quote to your real numbers.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                <input
                  name="businessName"
                  value={form.businessName}
                  onChange={handleChange}
                  placeholder="e.g. Mike's Plumbing LLC"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Trade</label>
                  <select
                    name="trade"
                    value={form.trade}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {TRADES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                  <select
                    name="region"
                    value={form.region}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Pricing Defaults</h2>
            <p className="text-sm text-gray-400 mb-5">Used to calculate labor and markup on every quote. You can override per job.</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Hourly Rate ($/hr)</label>
                <input
                  name="hourlyRate"
                  type="number"
                  value={form.hourlyRate}
                  onChange={handleChange}
                  placeholder="75"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Markup (%)</label>
                <input
                  name="markup"
                  type="number"
                  value={form.markup}
                  onChange={handleChange}
                  placeholder="20"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">Added on top of materials cost</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Crew Size</label>
                <select
                  name="crewSize"
                  value={form.crewSize}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1">Solo (1 person)</option>
                  <option value="2">2-person crew</option>
                  <option value="3">3-person crew</option>
                  <option value="4">4+ person crew</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Material Quality</label>
                <select
                  name="materialTier"
                  value={form.materialTier}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="budget">Budget — lowest cost materials</option>
                  <option value="standard">Standard — mid-range (recommended)</option>
                  <option value="premium">Premium — high-end materials</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !form.businessName}
          className="mt-6 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-sm"
        >
          {saving ? 'Saving...' : isNew ? 'Save Profile & Start Quoting →' : 'Update Profile'}
        </button>
      </div>
    </main>
  )
}
