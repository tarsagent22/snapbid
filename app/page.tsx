'use client'

import { useState, useEffect } from 'react'
import { useUser, UserButton, SignInButton, useClerk } from '@clerk/nextjs'
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

const FREE_QUOTA = 3
const FORM_STORAGE_KEY = 'snapbid_draft_form'

export default function Home() {
  const { user, isLoaded } = useUser()
  const { openSignIn } = useClerk()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [quotesUsed, setQuotesUsed] = useState(0)
  const [showPaywall, setShowPaywall] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const [showUpgradedBanner, setShowUpgradedBanner] = useState(false)
  const isSubscribed = !!(user?.publicMetadata?.subscribed)
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new')
  const [history, setHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [form, setForm] = useState({
    businessName: '',
    trade: '',
    clientName: '',
    clientAddress: '',
    clientEmail: '',
    jobDescription: '',
    materialTierOverride: '',
    jobType: '',
    propertyType: '',
    accessDifficulty: '',
  })
  const [loading, setLoading] = useState(false)
  const [quote, setQuote] = useState<any>(null)
  const [error, setError] = useState('')
  const [lineItemOverrides, setLineItemOverrides] = useState<Record<number, string>>({})
  const [editingLineItem, setEditingLineItem] = useState<number | null>(null)
  const [editingValue, setEditingValue] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [emailed, setEmailed] = useState(false)
  const [descCount, setDescCount] = useState(0)
  const [selectedTier, setSelectedTier] = useState<'budget' | 'standard' | 'premium'>('standard')
  const [waitlistEmail, setWaitlistEmail] = useState('')
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false)
  const [waitlistDone, setWaitlistDone] = useState(false)
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null)
  const [historyPdfDownloading, setHistoryPdfDownloading] = useState<string | null>(null)
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null)
  const [reuseFlash, setReuseFlash] = useState<string | null>(null)
  const [loadingStep, setLoadingStep] = useState(0)

  // Restore draft form from sessionStorage (survives sign-in redirect)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(FORM_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setForm(f => ({ ...f, ...parsed }))
        setDescCount(parsed.jobDescription?.length || 0)
        sessionStorage.removeItem(FORM_STORAGE_KEY)
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (user) {
      fetch('/api/profile')
        .then(r => r.json())
        .then(data => {
          if (data.profile) {
            setProfile(data.profile)
            setQuotesUsed(data.profile.quoteCount || 0)
            setForm(f => ({
              ...f,
              // Only fill business/trade if the draft doesn't already have client info
              businessName: f.businessName || data.profile.businessName,
              trade: f.trade || data.profile.trade,
            }))
          } else {
            router.push('/profile')
          }
        })
    }
  }, [user, router])

  // Handle ?upgraded=true after Stripe checkout success
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('upgraded') === 'true') {
        setShowUpgradedBanner(true)
        window.history.replaceState({}, '', '/')
        setTimeout(() => setShowUpgradedBanner(false), 6000)
      }
    }
  }, [])

  // Cycle loading step messages while AI is generating
  useEffect(() => {
    if (!loading) { setLoadingStep(0); return }
    const id = setInterval(() => setLoadingStep(s => Math.min(s + 1, 4)), 2800)
    return () => clearInterval(id)
  }, [loading])

  // Load history when tab switches
  useEffect(() => {
    if (activeTab === 'history' && user && history.length === 0) {
      setHistoryLoading(true)
      fetch('/api/quotes')
        .then(r => r.json())
        .then(data => setHistory(data.history || []))
        .finally(() => setHistoryLoading(false))
    }
  }, [activeTab, user, history.length])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const updated = { ...form, [e.target.name]: e.target.value }
    setForm(updated)
    if (e.target.name === 'jobDescription') setDescCount(e.target.value.length)
    // Persist draft so it survives sign-in redirect
    try { sessionStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(updated)) } catch {}
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Gate 1: guests must sign in — save form first so it survives the redirect
    if (!user) {
      try { sessionStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(form)) } catch {}
      openSignIn({ forceRedirectUrl: '/' })
      return
    }

    // Gate 2: over free quota and not subscribed — show paywall
    if (quotesUsed >= FREE_QUOTA && !isSubscribed) {
      setShowPaywall(true)
      return
    }

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
      setLineItemOverrides({}) // reset any prior overrides
      setEditingLineItem(null)
      // Update local count from server response
      if (data.quoteCount !== undefined) setQuotesUsed(data.quoteCount)
      // Clear draft and invalidate history cache
      try { sessionStorage.removeItem(FORM_STORAGE_KEY) } catch {}
      setHistory([]) // will re-fetch if user opens history tab
    } catch (err: any) {
      setError('Couldn\'t generate the quote. Try describing the job with more detail.')
    } finally {
      setLoading(false)
    }
  }

  const calcTotalsWithOverrides = (items: any[], baseTotals: any) => {
    const hasOverrides = Object.keys(lineItemOverrides).length > 0
    if (!hasOverrides) return baseTotals
    const newSubtotal = items.reduce((sum: number, item: any, i: number) => {
      const val = lineItemOverrides[i] !== undefined ? parseFloat(lineItemOverrides[i]) : (item.total || 0)
      return sum + val
    }, 0)
    const taxRate = baseTotals?.tax && baseTotals?.subtotal ? (baseTotals.tax / baseTotals.subtotal) : 0
    const newTax = Math.round(newSubtotal * taxRate)
    return { ...baseTotals, subtotal: newSubtotal, tax: newTax, total: newSubtotal + newTax }
  }

  const handleCopyQuote = () => {
    if (!quote) return
    const activeItems = quote.tiered ? (quote.tiers?.[selectedTier]?.lineItems || []) : (quote.lineItems || [])
    const activeTotals = calcTotalsWithOverrides(activeItems, quote.tiered ? quote.tiers?.[selectedTier] : quote)
    const tierLabel = quote.tiered ? ` (${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} Option)` : ''
    const lines = activeItems.map((item: any, i: number) =>
      `  ${item.description}: $${lineItemOverrides[i] ?? item.total}`
    ).join('\n') ?? ''
    const text = `QUOTE #${quote.quoteNumber}${tierLabel}\nClient: ${form.clientName}\nAddress: ${form.clientAddress}${form.clientEmail ? `\nEmail: ${form.clientEmail}` : ''}\n\n${lines}\n\nSubtotal: $${activeTotals?.subtotal}\nTax: $${activeTotals?.tax}\nTOTAL: $${activeTotals?.total}`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleEmailQuote = () => {
    if (!quote) return
    const activeItems = quote.tiered ? (quote.tiers?.[selectedTier]?.lineItems || []) : (quote.lineItems || [])
    const activeTotals = calcTotalsWithOverrides(activeItems, quote.tiered ? quote.tiers?.[selectedTier] : quote)
    const tierLabel = quote.tiered ? ` — ${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} Option` : ''
    const biz = profile?.businessName || form.businessName
    const validDays = profile?.quoteValidityDays || 30
    const validUntil = new Date(Date.now() + validDays * 86400000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

    const lineList = activeItems.map((item: any, i: number) =>
      `• ${item.description} (${item.qty}) — $${lineItemOverrides[i] ?? item.total}`
    ).join('\n')

    const inclList = quote.inclusions && quote.inclusions.length > 0
      ? `\nWhat's Included:\n${quote.inclusions.map((s: string) => `✓ ${s}`).join('\n')}\n`
      : ''
    const exclList = quote.exclusions && quote.exclusions.length > 0
      ? `\nNot Included:\n${quote.exclusions.map((s: string) => `✗ ${s}`).join('\n')}\n`
      : ''

    const subject = encodeURIComponent(`Quote from ${biz} — ${quote.quoteNumber}`)
    const body = encodeURIComponent(
`Hi ${form.clientName},

Please find your quote below.

QUOTE #${quote.quoteNumber}${tierLabel}
From: ${biz}
Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
${quote.scopeOfWork ? `\nScope of Work:\n${quote.scopeOfWork}\n` : ''}
---
${lineList}
---

Subtotal: $${activeTotals?.subtotal}
Tax (est.): $${activeTotals?.tax}
TOTAL: $${activeTotals?.total}
${inclList}${exclList}
${quote.notes ? `Notes: ${quote.notes}\n\n` : ''}This quote is valid until ${validUntil}.

Please reply to this email to confirm or ask any questions.

Thank you for the opportunity!
${biz}`
    )

    const mailto = `mailto:${form.clientEmail ? encodeURIComponent(form.clientEmail) : ''}?subject=${subject}&body=${body}`
    window.location.href = mailto
    setEmailed(true)
    setTimeout(() => setEmailed(false), 3000)
  }

  const handleLineItemEditStart = (index: number, currentValue: string | number) => {
    setEditingLineItem(index)
    setEditingValue(String(currentValue))
  }

  const handleLineItemEditCommit = (index: number) => {
    const parsed = parseFloat(editingValue.replace(/[^0-9.]/g, ''))
    if (!isNaN(parsed) && parsed >= 0) {
      setLineItemOverrides(prev => ({ ...prev, [index]: String(Math.round(parsed)) }))
    }
    setEditingLineItem(null)
    setEditingValue('')
  }

  const handleLineItemEditCancel = () => {
    setEditingLineItem(null)
    setEditingValue('')
  }

  const handleLineItemEditKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') handleLineItemEditCommit(index)
    if (e.key === 'Escape') handleLineItemEditCancel()
  }

  const handleResetLineItemOverride = (e: React.MouseEvent, index: number) => {
    e.stopPropagation()
    setLineItemOverrides(prev => {
      const next = { ...prev }
      delete next[index]
      return next
    })
  }

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!waitlistEmail) return
    setWaitlistSubmitting(true)
    try {
      await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: waitlistEmail }),
      })
    } catch {}
    setWaitlistSubmitting(false)
    setWaitlistDone(true)
  }

  const handleUpgrade = async () => {
    setUpgrading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      setUpgrading(false)
    }
  }

  const handleUpdateStatus = async (quoteId: string, status: 'pending' | 'won' | 'lost') => {
    setStatusUpdating(quoteId)
    try {
      await fetch('/api/quotes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: quoteId, status }),
      })
      // Update local history state optimistically
      setHistory(prev => prev.map(q => q.id === quoteId ? { ...q, status } : q))
    } catch {}
    setStatusUpdating(null)
  }

  const handleReuseQuote = (q: any) => {
    // Pre-fill the new quote form from a history entry.
    // We copy client info and job context, but clear the client name/address
    // so the contractor can adjust if it's a different client (they see it's pre-filled).
    setForm(f => ({
      ...f,
      clientName: q.clientName || '',
      clientAddress: q.clientAddress || '',
      clientEmail: q.clientEmail || '',
      jobDescription: q.jobDescription || '',
      // Don't carry over material tier / job type / property / access — let the user choose fresh
      materialTierOverride: '',
      jobType: '',
      propertyType: '',
      accessDifficulty: '',
    }))
    setDescCount((q.jobDescription || '').length)
    setQuote(null)
    setError('')
    setLineItemOverrides({})
    setActiveTab('new')
    setReuseFlash(q.id)
    setTimeout(() => setReuseFlash(null), 3000)
    // Scroll to top so the user sees the pre-filled form
    window.scrollTo({ top: 0, behavior: 'smooth' })
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

    // Logo (if available) — render left side, push text right
    const logoDataUrl = profile?.logoDataUrl
    let textLeft = margin
    if (logoDataUrl) {
      try {
        const fmt = logoDataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG'
        doc.addImage(logoDataUrl, fmt, margin, 10, 52, 52)
        textLeft = margin + 62
      } catch {}
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text(biz, textLeft, 36)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.text(trade ? trade.charAt(0).toUpperCase() + trade.slice(1) + ' Services' : '', textLeft, 54)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text(`Quote ${quote.quoteNumber}`, pageW - margin, 32, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(date, pageW - margin, 48, { align: 'right' })
    doc.text(`Valid for ${profile?.quoteValidityDays || 30} days`, pageW - margin, 62, { align: 'right' })
    y = 96

    const pdfClientBoxH = form.clientEmail ? 68 : 56
    doc.setFillColor(249, 250, 251)
    doc.roundedRect(margin, y, contentW, pdfClientBoxH, 4, 4, 'F')
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
    if (form.clientEmail) {
      doc.setFontSize(9)
      doc.text(form.clientEmail, margin + 12, y + 60)
    }
    y += pdfClientBoxH + 16

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
    const showMarkup = profile?.showMarkupOnQuote
    const pdfItems = (quote.tiered ? (quote.tiers?.[selectedTier]?.lineItems || []) : (quote.lineItems || []))
      .filter((item: any) => showMarkup || !item.description.toLowerCase().includes('markup'))
    const pdfTotals = calcTotalsWithOverrides(pdfItems, quote.tiered ? quote.tiers?.[selectedTier] : quote)
    ;(pdfItems).forEach((item: any, i: number) => {
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
    doc.text(`$${pdfTotals?.subtotal}`, pageW - margin, y + 14, { align: 'right' })
    const hasTax1 = (pdfTotals?.tax ?? 0) > 0
    if (hasTax1) {
      doc.text('Tax (est.)', totalsX, y + 30)
      doc.text(`$${pdfTotals?.tax}`, pageW - margin, y + 30, { align: 'right' })
    }
    const lineY1 = hasTax1 ? y + 36 : y + 20
    const totalY1 = hasTax1 ? y + 52 : y + 36
    doc.setDrawColor(229, 231, 235)
    doc.line(totalsX, lineY1, pageW - margin, lineY1)
    doc.setTextColor(37, 99, 235)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text('TOTAL', totalsX, totalY1)
    doc.text(`$${pdfTotals?.total}`, pageW - margin, totalY1, { align: 'right' })
    y += hasTax1 ? 72 : 56

    // Helper: render a labeled section box with bullet items
    const renderSectionBox = (
      label: string,
      items: string[],
      prefix: string,
      bgColor: [number,number,number],
      labelColor: [number,number,number],
      textColor: [number,number,number],
      lineH: number = 14
    ) => {
      if (items.length === 0) return
      const LINE_SIZE = 10
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(LINE_SIZE)
      const wrapped = items.map((s: string) => {
        const bullet = `${prefix} ${s}`
        return doc.splitTextToSize(bullet, contentW - 28)
      })
      let boxH = 22 // header height
      wrapped.forEach((lines: string[]) => { boxH += lines.length * lineH + 3 })
      boxH += 8 // bottom padding
      doc.setFillColor(...bgColor)
      doc.roundedRect(margin, y, contentW, boxH, 4, 4, 'F')
      doc.setTextColor(...labelColor)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.text(label, margin + 12, y + 14)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(LINE_SIZE)
      doc.setTextColor(...textColor)
      let itemY = y + 24
      wrapped.forEach((lines: string[]) => {
        doc.text(lines, margin + 12, itemY)
        itemY += lines.length * lineH + 3
      })
      y += boxH + 10
    }

    // Scope of work — after totals
    if (quote.scopeOfWork) {
      const rawParts = quote.scopeOfWork.split(/\n/).map((s: string) => s.trim()).filter(Boolean)
      const scopeParts = rawParts.length > 1
        ? rawParts
        : quote.scopeOfWork.split(/(?<=[.!?])\s+/).map((s: string) => s.trim()).filter(Boolean)
      renderSectionBox('SCOPE OF WORK', scopeParts, '-', [239,246,255], [29,78,216], [30,58,138])
    }

    // Inclusions & Exclusions — stacked vertically, full width
    const pdfInclusions: string[] = quote.inclusions || []
    const pdfExclusions: string[] = quote.exclusions || []
    renderSectionBox("WHAT'S INCLUDED", pdfInclusions, '-', [240,253,244], [22,101,52], [20,83,45])
    renderSectionBox('NOT INCLUDED', pdfExclusions, '-', [255,251,235], [146,64,14], [120,53,15])

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
      doc.setTextColor(55, 65, 81)
      let noteItemY = y + 30
      noteLines.forEach((line: string) => {
        doc.text(line, margin + 12, noteItemY)
        noteItemY += 14
      })
      y += noteH + 16
    }

    doc.setDrawColor(229, 231, 235)
    doc.line(margin, y + 8, pageW - margin, y + 8)
    doc.setTextColor(156, 163, 175)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`${biz} · Estimate prepared with SnapBid`, pageW / 2, y + 22, { align: 'center' })
    doc.save(`snapbid-quote-${form.clientName.replace(/\s+/g, '-')}.pdf`)
  }

  const handleDownloadHistoryPDF = async (q: any) => {
    setHistoryPdfDownloading(q.id)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ unit: 'pt', format: 'letter' })
      const biz = profile?.businessName || q.businessName || 'My Business'
      const trade = profile?.trade || ''
      const date = new Date(q.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      const pageW = doc.internal.pageSize.getWidth()
      const margin = 48
      const contentW = pageW - margin * 2
      let y = margin

      doc.setFillColor(37, 99, 235)
      doc.rect(0, 0, pageW, 72, 'F')
      doc.setTextColor(255, 255, 255)

      const logoDataUrl = profile?.logoDataUrl
      let textLeft = margin
      if (logoDataUrl) {
        try {
          const fmt = logoDataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG'
          doc.addImage(logoDataUrl, fmt, margin, 10, 52, 52)
          textLeft = margin + 62
        } catch {}
      }

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(20)
      doc.text(biz, textLeft, 36)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      doc.text(trade ? trade.charAt(0).toUpperCase() + trade.slice(1) + ' Services' : '', textLeft, 54)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.text(`Quote ${q.quoteNumber}`, pageW - margin, 32, { align: 'right' })
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text(date, pageW - margin, 48, { align: 'right' })
      y = 96

      const histClientBoxH = q.clientEmail ? 68 : 56
      doc.setFillColor(249, 250, 251)
      doc.roundedRect(margin, y, contentW, histClientBoxH, 4, 4, 'F')
      doc.setTextColor(107, 114, 128)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('PREPARED FOR', margin + 12, y + 16)
      doc.setTextColor(17, 24, 39)
      doc.setFontSize(12)
      doc.text(q.clientName || '—', margin + 12, y + 32)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(107, 114, 128)
      doc.text(q.clientAddress || '', margin + 12, y + 46)
      if (q.clientEmail) {
        doc.setFontSize(9)
        doc.text(q.clientEmail, margin + 12, y + 60)
      }
      y += histClientBoxH + 16

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
      const items = q.lineItems || []
      items.forEach((item: any, i: number) => {
        if (i % 2 === 1) { doc.setFillColor(249, 250, 251); doc.rect(margin, y, contentW, 24, 'F') }
        doc.setTextColor(55, 65, 81)
        const descLines = doc.splitTextToSize(item.description, contentW * 0.55)
        doc.text(descLines, margin + 8, y + 16)
        doc.setTextColor(107, 114, 128)
        doc.text(String(item.qty), margin + contentW * 0.62, y + 16, { align: 'right' })
        doc.text(`$${item.unitPrice}`, margin + contentW * 0.78, y + 16, { align: 'right' })
        doc.setTextColor(17, 24, 39)
        doc.setFont('helvetica', 'bold')
        doc.text(`$${item.total}`, margin + contentW, y + 16, { align: 'right' })
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
      doc.text(`$${q.subtotal}`, pageW - margin, y + 14, { align: 'right' })
      const hasTax2 = (q.tax ?? 0) > 0
      if (hasTax2) {
        doc.text('Tax (est.)', totalsX, y + 30)
        doc.text(`$${q.tax}`, pageW - margin, y + 30, { align: 'right' })
      }
      const lineY2 = hasTax2 ? y + 36 : y + 20
      const totalY2 = hasTax2 ? y + 52 : y + 36
      doc.setDrawColor(229, 231, 235)
      doc.line(totalsX, lineY2, pageW - margin, lineY2)
      doc.setTextColor(37, 99, 235)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.text('TOTAL', totalsX, totalY2)
      doc.text(`$${q.total}`, pageW - margin, totalY2, { align: 'right' })
      y += hasTax2 ? 72 : 56

      // Reusable section renderer for history PDF
      const renderHistSection = (
        label: string,
        items: string[],
        bgColor: [number,number,number],
        labelColor: [number,number,number],
        textColor: [number,number,number]
      ) => {
        if (items.length === 0) return
        const LINE_SIZE = 10
        const LINE_H = 14
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(LINE_SIZE)
        const wrapped = items.map((s: string) => doc.splitTextToSize(`- ${s}`, contentW - 28))
        let boxH = 22
        wrapped.forEach((lines: string[]) => { boxH += lines.length * LINE_H + 3 })
        boxH += 8
        doc.setFillColor(...bgColor)
        doc.roundedRect(margin, y, contentW, boxH, 4, 4, 'F')
        doc.setTextColor(...labelColor)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.text(label, margin + 12, y + 14)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(LINE_SIZE)
        doc.setTextColor(...textColor)
        let itemY = y + 24
        wrapped.forEach((lines: string[]) => {
          doc.text(lines, margin + 12, itemY)
          itemY += lines.length * LINE_H + 3
        })
        y += boxH + 10
      }

      // Scope of work — after totals
      if (q.scopeOfWork) {
        const rawParts = q.scopeOfWork.split(/\n/).map((s: string) => s.trim()).filter(Boolean)
        const scopeParts = rawParts.length > 1
          ? rawParts
          : q.scopeOfWork.split(/(?<=[.!?])\s+/).map((s: string) => s.trim()).filter(Boolean)
        renderHistSection('SCOPE OF WORK', scopeParts, [239,246,255], [29,78,216], [30,58,138])
      }

      // Inclusions & Exclusions — stacked vertically, full width
      const histInclusions: string[] = q.inclusions || []
      const histExclusions: string[] = q.exclusions || []
      renderHistSection("WHAT'S INCLUDED", histInclusions, [240,253,244], [22,101,52], [20,83,45])
      renderHistSection('NOT INCLUDED', histExclusions, [255,251,235], [146,64,14], [120,53,15])

      if (q.notes) {
        doc.setFillColor(239, 246, 255)
        const noteLines = doc.splitTextToSize(q.notes, contentW - 24)
        const noteH = noteLines.length * 14 + 28
        doc.roundedRect(margin, y, contentW, noteH, 4, 4, 'F')
        doc.setTextColor(29, 78, 216)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.text('NOTES', margin + 12, y + 16)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.setTextColor(55, 65, 81)
        let histNoteItemY = y + 30
        noteLines.forEach((line: string) => {
          doc.text(line, margin + 12, histNoteItemY)
          histNoteItemY += 14
        })
        y += noteH + 16
      }

      doc.setDrawColor(229, 231, 235)
      doc.line(margin, y + 8, pageW - margin, y + 8)
      doc.setTextColor(156, 163, 175)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text(`${biz} · Estimate prepared with SnapBid`, pageW / 2, y + 22, { align: 'center' })
      doc.save(`snapbid-quote-${(q.clientName || 'quote').replace(/\s+/g, '-')}.pdf`)
    } finally {
      setHistoryPdfDownloading(null)
    }
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

      {/* ── UPGRADE SUCCESS BANNER ──────────────────────────────────────────── */}
      {showUpgradedBanner && (
        <div className="bg-green-500 text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
              </svg>
              <span className="text-sm font-semibold">Welcome to SnapBid Pro! You now have unlimited quotes.</span>
            </div>
            <button onClick={() => setShowUpgradedBanner(false)} className="text-white/70 hover:text-white transition-colors">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── PROFILE CALIBRATION BAR (signed-in) ────────────────────────────── */}
      {profile && (
        <div className="bg-[#2563EB]/5 border-b border-[#2563EB]/10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-blue-700 font-medium">⚡ Calibrated to {profile.businessName}</span>
              <span className="hidden sm:inline text-blue-300 text-xs">·</span>
              <span className="hidden sm:inline text-xs text-blue-500">${profile.hourlyRate}/hr · {profile.materialTier} materials · {profile.region}</span>
            </div>
            <div className="flex items-center gap-3">
              {/* Quota pill */}
              {isSubscribed ? (
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  ⚡ Pro — Unlimited
                </span>
              ) : (
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                  quotesUsed >= FREE_QUOTA
                    ? 'bg-red-100 text-red-600'
                    : quotesUsed >= FREE_QUOTA - 1
                    ? 'bg-orange-100 text-orange-600'
                    : 'bg-blue-100 text-blue-600'
                }`}>
                  {quotesUsed >= FREE_QUOTA
                    ? 'Free limit reached'
                    : `${FREE_QUOTA - quotesUsed} free quote${FREE_QUOTA - quotesUsed !== 1 ? 's' : ''} left`}
                </span>
              )}
              <button onClick={() => router.push('/profile')} className="text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap transition-colors">
                Edit profile →
              </button>
            </div>
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
            <p className="text-xs text-gray-400 mt-3">Free account · 3 quotes included · No credit card</p>

            {/* Social proof */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-12 text-left">
              {[
                { quote: 'Used to spend 45 minutes on every quote. Now it takes me 60 seconds and my clients think I\'m way more professional.', name: 'Marcus T.', trade: 'Electrician · Texas' },
                { quote: 'The PDF looks better than what most big companies send. Closed 3 jobs last week that I probably would\'ve lost before.', name: 'Jen R.', trade: 'General Contractor · Ohio' },
                { quote: 'Set up my hourly rate once and every quote just works. Calibrated to my numbers, not some national average.', name: 'Derek W.', trade: 'Plumber · Colorado' },
              ].map(t => (
                <div key={t.name} className="bg-white/80 rounded-2xl border border-gray-100 px-5 py-4 shadow-sm text-left">
                  <div className="flex gap-0.5 mb-3">
                    {[1,2,3,4,5].map(s => (
                      <svg key={s} className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">&ldquo;{t.quote}&rdquo;</p>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">{t.name}</p>
                    <p className="text-[11px] text-gray-400">{t.trade}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* How it works */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 text-left">
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

      {/* ── TAB BAR (signed-in only) ─────────────────────────────────────────── */}
      {user && !quote && (
        <div className="border-b border-gray-100 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 flex gap-6">
            {(['new', 'history'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-[#2563EB] text-[#2563EB]'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}>
                {tab === 'new' ? 'New Quote' : 'Quote History'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* ── HISTORY TAB ── */}
        {activeTab === 'history' && user && !quote ? (
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold text-gray-900">Quote History</h2>
              {history.length > 0 && (() => {
                const won = history.filter(q => q.status === 'won').length
                const lost = history.filter(q => q.status === 'lost').length
                const pending = history.filter(q => !q.status || q.status === 'pending').length
                const total = history.length
                const winRate = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : null
                return (
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                      <span className="text-gray-500">{won} won</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                      <span className="text-gray-500">{lost} lost</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
                      <span className="text-gray-500">{pending} pending</span>
                    </div>
                    {winRate !== null && (
                      <span className="bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full">
                        {winRate}% win rate
                      </span>
                    )}
                  </div>
                )
              })()}
            </div>
            {historyLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-shimmer h-20" />
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-3 mx-auto">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M6 7h8M6 10h6M6 13h4M4 3h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z"
                      stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-400">No quotes yet</p>
                <p className="text-xs text-gray-300 mt-1">Your generated quotes will appear here</p>
                <button onClick={() => setActiveTab('new')}
                  className="mt-4 text-sm text-[#2563EB] hover:underline font-medium">
                  Generate your first quote →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((q: any) => {
                  const isExpanded = expandedHistoryId === q.id
                  return (
                    <div key={q.id} className={`bg-white rounded-2xl border shadow-sm transition-all duration-200 ${isExpanded ? 'border-[#2563EB]/30 shadow-blue-50' : 'border-gray-100 hover:border-gray-200'}`}>
                      {/* Summary row — always visible, clickable to expand */}
                      <button
                        type="button"
                        className="w-full text-left p-5"
                        onClick={() => setExpandedHistoryId(isExpanded ? null : q.id)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-xs font-mono text-gray-400">{q.quoteNumber}</span>
                              <span className="text-gray-200 text-xs">·</span>
                              <span className="text-xs text-gray-400">{new Date(q.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              {q.status === 'won' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                                  WON
                                </span>
                              )}
                              {q.status === 'lost' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">
                                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12"/></svg>
                                  LOST
                                </span>
                              )}
                              {(!q.status || q.status === 'pending') && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400">
                                  PENDING
                                </span>
                              )}
                            </div>
                            <p className="font-semibold text-gray-900 text-sm">{q.clientName || '—'}</p>
                            <p className="text-xs text-gray-400 truncate">{q.clientAddress}</p>
                            {q.jobDescription && !isExpanded && (
                              <p className="text-xs text-gray-400 mt-1 truncate italic">"{q.jobDescription}"</p>
                            )}
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="text-right">
                              <p className="text-lg font-bold text-gray-900">${q.total?.toLocaleString()}</p>
                              <p className="text-xs text-gray-400">{q.lineItems?.length || 0} line items</p>
                            </div>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isExpanded ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7"/>
                              </svg>
                            </div>
                          </div>
                        </div>
                      </button>

                      {/* Expanded detail panel */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 px-5 pb-5">
                          {/* Client email (if present) */}
                          {q.clientEmail && (
                            <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
                              <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                              </svg>
                              <a href={`mailto:${q.clientEmail}`} className="hover:text-blue-500 transition-colors">{q.clientEmail}</a>
                            </div>
                          )}

                          {/* Scope of Work (if present) */}
                          {q.scopeOfWork && (
                            <div className="mt-4 mb-2 bg-blue-50 border border-blue-100 rounded-xl p-3.5">
                              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Scope of Work</p>
                              <p className="text-sm text-blue-800 leading-relaxed">{q.scopeOfWork}</p>
                            </div>
                          )}

                          {/* Job description */}
                          {q.jobDescription && (
                            <div className={`${q.scopeOfWork ? 'mb-3' : 'mt-4 mb-3'} bg-gray-50 rounded-xl p-3.5`}>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Job</p>
                              <p className="text-sm text-gray-700 italic">"{q.jobDescription}"</p>
                            </div>
                          )}

                          {/* Line items table */}
                          {q.lineItems && q.lineItems.length > 0 && (
                            <div className="mt-3">
                              {/* Desktop */}
                              <div className="hidden sm:block">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-gray-100">
                                      <th className="text-left pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Description</th>
                                      <th className="text-right pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide w-14">Qty</th>
                                      <th className="text-right pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide w-20">Unit</th>
                                      <th className="text-right pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide w-20">Total</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {q.lineItems.map((item: any, i: number) => (
                                      <tr key={i} className="border-b border-gray-50 last:border-0">
                                        <td className="py-2 text-gray-700 pr-4 text-sm">{item.description}</td>
                                        <td className="py-2 text-right text-gray-400 text-sm tabular-nums">{item.qty}</td>
                                        <td className="py-2 text-right text-gray-400 text-sm tabular-nums">${item.unitPrice}</td>
                                        <td className="py-2 text-right font-semibold text-gray-900 text-sm tabular-nums">${item.total}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                              {/* Mobile */}
                              <div className="sm:hidden space-y-2">
                                {q.lineItems.map((item: any, i: number) => (
                                  <div key={i} className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-sm font-medium text-gray-800 mb-1">{item.description}</p>
                                    <div className="flex justify-between text-xs text-gray-400">
                                      <span>Qty {item.qty} × ${item.unitPrice}</span>
                                      <span className="font-semibold text-gray-900">${item.total}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Totals */}
                              <div className="flex justify-end mt-3 pt-3 border-t border-gray-100">
                                <div className="w-48 space-y-1.5 text-sm">
                                  <div className="flex justify-between text-gray-500">
                                    <span>Subtotal</span><span className="tabular-nums">${q.subtotal?.toLocaleString()}</span>
                                  </div>
                                  {(q.tax ?? 0) > 0 && (
                                    <div className="flex justify-between text-gray-500">
                                      <span>Tax</span><span className="tabular-nums">${q.tax?.toLocaleString()}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between font-bold text-sm pt-1.5 border-t border-gray-100">
                                    <span>Total</span>
                                    <span className="text-[#2563EB] tabular-nums">${q.total?.toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Inclusions & Exclusions in history */}
                          {((q.inclusions && q.inclusions.length > 0) || (q.exclusions && q.exclusions.length > 0)) && (
                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {q.inclusions && q.inclusions.length > 0 && (
                                <div className="bg-green-50 border border-green-100 rounded-xl p-3.5">
                                  <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-1.5">✓ Included</p>
                                  <ul className="space-y-1">
                                    {q.inclusions.map((item: string, i: number) => (
                                      <li key={i} className="text-xs text-green-800 flex items-start gap-1.5">
                                        <svg className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                                        </svg>
                                        {item}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {q.exclusions && q.exclusions.length > 0 && (
                                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5">
                                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1.5">⚠ Not Included</p>
                                  <ul className="space-y-1">
                                    {q.exclusions.map((item: string, i: number) => (
                                      <li key={i} className="text-xs text-amber-800 flex items-start gap-1.5">
                                        <svg className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                                        </svg>
                                        {item}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Notes */}
                          {q.notes && (
                            <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl p-3.5">
                              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Notes</p>
                              <p className="text-sm text-blue-800 leading-relaxed">{q.notes}</p>
                            </div>
                          )}

                          {/* Quote status tracking */}
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Quote Status</p>
                            <div className="flex gap-2">
                              {(['won', 'pending', 'lost'] as const).map(s => {
                                const isActive = q.status === s || (!q.status && s === 'pending')
                                const isLoading = statusUpdating === q.id
                                const styles: Record<string, string> = {
                                  won: isActive
                                    ? 'bg-green-500 border-green-500 text-white shadow-sm shadow-green-100'
                                    : 'bg-white border-gray-200 text-gray-500 hover:border-green-300 hover:text-green-600',
                                  pending: isActive
                                    ? 'bg-gray-200 border-gray-200 text-gray-700'
                                    : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300',
                                  lost: isActive
                                    ? 'bg-red-500 border-red-500 text-white shadow-sm shadow-red-100'
                                    : 'bg-white border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500',
                                }
                                const icons: Record<string, React.ReactNode> = {
                                  won: <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>,
                                  pending: <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth={2}/><path d="M12 6v6l4 2" strokeLinecap="round" strokeWidth={2}/></svg>,
                                  lost: <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12"/></svg>,
                                }
                                return (
                                  <button
                                    key={s}
                                    type="button"
                                    disabled={isLoading || isActive}
                                    onClick={() => handleUpdateStatus(q.id, s)}
                                    className={`flex items-center gap-1.5 border font-semibold py-1.5 px-3 rounded-xl text-xs transition-all disabled:cursor-default ${styles[s]}`}
                                  >
                                    {isLoading && !isActive ? (
                                      <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                      </svg>
                                    ) : icons[s]}
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 mt-4 flex-wrap">
                            <button
                              onClick={() => handleDownloadHistoryPDF(q)}
                              disabled={historyPdfDownloading === q.id}
                              className="flex items-center gap-1.5 bg-[#2563EB] hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2 px-4 rounded-xl text-xs transition-colors shadow-sm shadow-blue-100"
                            >
                              {historyPdfDownloading === q.id ? (
                                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                                  <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                </svg>
                              ) : (
                                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                                </svg>
                              )}
                              {historyPdfDownloading === q.id ? 'Generating…' : 'Download PDF'}
                            </button>
                            <button
                              onClick={() => handleReuseQuote(q)}
                              className={`flex items-center gap-1.5 border font-semibold py-2 px-4 rounded-xl text-xs transition-all ${
                                reuseFlash === q.id
                                  ? 'bg-green-500 border-green-500 text-white'
                                  : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50'
                              }`}
                            >
                              {reuseFlash === q.id ? (
                                <>
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                                  </svg>
                                  Form pre-filled!
                                </>
                              ) : (
                                <>
                                  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                                  </svg>
                                  Reuse Quote
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : !quote ? (
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

              {/* Pre-fill banner — shown briefly after reusing a quote */}
              {reuseFlash && (
                <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4 text-sm text-blue-700 animate-fade-in-up">
                  <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span>Form pre-filled from your previous quote — update any details and generate a new one.</span>
                </div>
              )}

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
                  <div>
                    <label className={lbl}>
                      Client Email
                      <span className="ml-1.5 text-[10px] font-normal text-gray-400 normal-case">— pre-fills Email Quote button</span>
                    </label>
                    <input name="clientEmail" value={form.clientEmail} onChange={handleChange}
                      type="email" placeholder="john@example.com (optional)" className={inp} />
                  </div>
                </div>

                {/* Job context */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Job Context</p>
                    <p className="text-xs text-gray-400 mt-1">Optional — helps the AI price more accurately</p>
                  </div>
                  {/* Job type */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Job Type</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { value: 'new-install', label: 'New Install' },
                        { value: 'repair', label: 'Repair' },
                        { value: 'replacement', label: 'Replacement' },
                        { value: 'maintenance', label: 'Maintenance' },
                        { value: 'emergency', label: '⚡ Emergency' },
                      ].map(opt => (
                        <button key={opt.value} type="button"
                          onClick={() => setForm(f => ({ ...f, jobType: f.jobType === opt.value ? '' : opt.value }))}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                            form.jobType === opt.value
                              ? opt.value === 'emergency' ? 'bg-orange-500 border-orange-500 text-white' : 'bg-[#2563EB] border-[#2563EB] text-white'
                              : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                          }`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Property type */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Property Type</p>
                    <div className="flex flex-wrap gap-1.5">
                      {['Residential', 'Commercial', 'Rental'].map(opt => (
                        <button key={opt} type="button"
                          onClick={() => setForm(f => ({ ...f, propertyType: f.propertyType === opt.toLowerCase() ? '' : opt.toLowerCase() }))}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                            form.propertyType === opt.toLowerCase()
                              ? 'bg-[#2563EB] border-[#2563EB] text-white'
                              : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                          }`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Access difficulty */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Site Access</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { value: 'easy', label: 'Easy' },
                        { value: 'moderate', label: 'Moderate' },
                        { value: 'difficult', label: 'Difficult' },
                      ].map(opt => (
                        <button key={opt.value} type="button"
                          onClick={() => setForm(f => ({ ...f, accessDifficulty: f.accessDifficulty === opt.value ? '' : opt.value }))}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                            form.accessDifficulty === opt.value
                              ? opt.value === 'difficult' ? 'bg-red-500 border-red-500 text-white' : opt.value === 'moderate' ? 'bg-amber-500 border-amber-500 text-white' : 'bg-green-500 border-green-500 text-white'
                              : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                          }`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Job description */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Job Description</p>
                  <div>
                    <textarea name="jobDescription" value={form.jobDescription} onChange={handleChange}
                      placeholder="Describe the job in plain English…"
                      required rows={4} maxLength={500}
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
                    <div className="flex-1">
                      <span>{error}</span>
                      <button
                        type="button"
                        onClick={() => setError('')}
                        className="ml-2 text-red-500 hover:text-red-700 underline text-xs font-medium transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
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
                  ) : !user ? (
                    <>
                      <svg width="14" height="14" fill="none" stroke="white" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                      </svg>
                      Sign in to Generate
                    </>
                  ) : quotesUsed >= FREE_QUOTA && !isSubscribed ? (
                    <>
                      🔒 Upgrade to Continue
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

                {/* Quota bar for signed-in users */}
                {user && quotesUsed < FREE_QUOTA && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${quotesUsed >= FREE_QUOTA - 1 ? 'bg-orange-400' : 'bg-[#2563EB]'}`}
                        style={{ width: `${(quotesUsed / FREE_QUOTA) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{quotesUsed}/{FREE_QUOTA} free quotes used</span>
                  </div>
                )}
              </form>
            </div>

            {/* ── SIDEBAR: Quote placeholder + How it works ── */}
            <div className="lg:col-span-2 space-y-5">
              {/* Quote placeholder / loading state / sample preview */}
              {loading ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm animate-fade-in-up">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <svg className="animate-spin w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">AI is building your quote</p>
                      <p className="text-xs text-gray-400">Usually 5–15 seconds</p>
                    </div>
                  </div>
                  <div className="space-y-3.5">
                    {['Reading job description…', 'Calculating your rates…', 'Building line items…', 'Finalizing totals…'].map((step, i) => (
                      <div key={i} className={`flex items-center gap-3 transition-all duration-500 ${i <= loadingStep && loadingStep <= 4 ? 'opacity-100' : 'opacity-25'}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                          i < loadingStep && loadingStep <= 4 ? 'bg-green-100' : i === loadingStep ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          {i < loadingStep && loadingStep <= 4 ? (
                            <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                            </svg>
                          ) : i === loadingStep ? (
                            <svg className="animate-spin w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                            </svg>
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-gray-300" />
                          )}
                        </div>
                        <span className={`text-xs transition-colors ${
                          i < loadingStep && loadingStep <= 4 ? 'text-gray-400 line-through' : i === loadingStep ? 'text-gray-800 font-medium' : 'text-gray-300'
                        }`}>{step}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 pt-4 border-t border-gray-50 space-y-2.5">
                    {[90, 65, 75, 55].map((w, i) => (
                      <div key={i} className="flex justify-between items-center gap-3">
                        <div className="h-2.5 animate-shimmer rounded-md" style={{width: `${w}%`}} />
                        <div className="h-2.5 animate-shimmer rounded-md w-10 flex-shrink-0" />
                      </div>
                    ))}
                    <div className="flex justify-end pt-2">
                      <div className="h-4 animate-shimmer rounded-md w-24" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  <div className="bg-[#2563EB] px-5 py-4 flex justify-between items-center">
                    <div>
                      <p className="text-white text-sm font-bold">Sample Output</p>
                      <p className="text-blue-200 text-xs mt-0.5">Roofing Services</p>
                    </div>
                    <div className="text-right">
                      <p className="text-blue-200 text-[10px] uppercase tracking-wide">Quote</p>
                      <p className="text-white text-xs font-bold mt-0.5">SB-0142</p>
                    </div>
                  </div>
                  <div className="px-5 py-4 space-y-2.5">
                    {[
                      { d: 'Tear-off existing shingles (800 sq ft)', t: '$480' },
                      { d: 'Ice & water shield underlayment', t: '$320' },
                      { d: 'Architectural shingles installation', t: '$1,560' },
                      { d: 'Ridge cap & flashing', t: '$280' },
                      { d: 'Cleanup & debris disposal', t: '$150' },
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between text-xs gap-3">
                        <span className="text-gray-500 truncate">{item.d}</span>
                        <span className="font-semibold text-gray-800 tabular-nums flex-shrink-0">{item.t}</span>
                      </div>
                    ))}
                    <div className="pt-2.5 border-t border-gray-100 flex justify-between items-center">
                      <span className="text-xs text-gray-400">Total</span>
                      <span className="text-sm font-bold text-[#2563EB]">$2,843</span>
                    </div>
                  </div>
                  <div className="px-5 pb-3.5">
                    <p className="text-[10px] text-gray-300 text-center italic">← AI-generated · calibrated to your rates</p>
                  </div>
                </div>
              )}

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
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">Quotes calibrated to your business</p>
                    <p className="text-xs text-gray-400 leading-relaxed">Sign in once to set your hourly rate, markup, and region. Every quote auto-adjusts to your exact numbers.</p>
                  </div>
                  <div className="space-y-2">
                    {[
                      'Accurate pricing every time',
                      'Your branding on the PDF',
                      'Quote history saved automatically',
                    ].map(f => (
                      <div key={f} className="flex items-center gap-2 text-xs text-gray-600">
                        <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                        </svg>
                        {f}
                      </div>
                    ))}
                  </div>
                  <SignInButton mode="modal" forceRedirectUrl="/">
                    <button className="w-full bg-[#2563EB] hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors shadow-sm shadow-blue-200">
                      Create free account →
                    </button>
                  </SignInButton>
                  <p className="text-center text-[11px] text-gray-400">
                    ✉️ Just your email — no password needed
                  </p>
                </div>
              )}
            </div>
          </div>

        ) : (

          /* ── QUOTE RESULT ──────────────────────────────────────────────── */
          <div className="animate-fade-in-up max-w-3xl mx-auto">
            {/* Success header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{quote.tiered ? 'Tiered Quote Ready' : 'Quote Ready'}</h2>
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

            {/* Tier selector (tiered quotes only) */}
            {quote.tiered && (
              <div className="flex gap-2 mb-4">
                {(['budget', 'standard', 'premium'] as const).map(tier => (
                  <button key={tier} type="button"
                    onClick={() => setSelectedTier(tier)}
                    className={`flex-1 relative py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      selectedTier === tier
                        ? 'bg-[#2563EB] border-[#2563EB] text-white shadow-md shadow-blue-200'
                        : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}>
                    {tier.charAt(0).toUpperCase() + tier.slice(1)}
                    {tier === 'standard' && (
                      <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        selectedTier === 'standard' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'
                      }`}>Recommended</span>
                    )}
                    {quote.tiers?.[tier] && (
                      <p className={`text-xs mt-0.5 ${selectedTier === tier ? 'text-blue-100' : 'text-gray-400'}`}>
                        ${quote.tiers[tier].total?.toLocaleString()}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}

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
                  <div className="mt-1.5 flex items-center gap-1 justify-end">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="flex-shrink-0">
                      <circle cx="5" cy="5" r="4" stroke="rgba(147,197,253,0.8)" strokeWidth="1"/>
                      <path d="M5 2.5v2.5l1.5 1.5" stroke="rgba(147,197,253,0.8)" strokeWidth="1" strokeLinecap="round"/>
                    </svg>
                    <p className="text-blue-200 text-xs">Expires {new Date(Date.now() + (profile?.quoteValidityDays || 30) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
              </div>

              <div className="px-8 py-6 space-y-6">
                {/* Bill to */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Prepared For</p>
                  <p className="font-semibold text-gray-900">{form.clientName}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{form.clientAddress}</p>
                  {form.clientEmail && (
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                      </svg>
                      {form.clientEmail}
                    </p>
                  )}
                </div>

                {/* Scope of Work */}
                {quote.scopeOfWork && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Scope of Work</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{quote.scopeOfWork}</p>
                  </div>
                )}

                {/* Line items — resolve from tier or standard quote */}
                {(() => {
                  const activeItems = quote.tiered
                    ? (quote.tiers?.[selectedTier]?.lineItems || [])
                    : (quote.lineItems || [])
                  const baseActiveTotals = quote.tiered
                    ? quote.tiers?.[selectedTier]
                    : quote
                  // Recalculate totals if any line items have been overridden
                  const hasOverrides = Object.keys(lineItemOverrides).length > 0
                  const activeTotals = hasOverrides ? (() => {
                    const newSubtotal = activeItems.reduce((sum: number, item: any, i: number) => {
                      const val = lineItemOverrides[i] !== undefined ? parseFloat(lineItemOverrides[i]) : (item.total || 0)
                      return sum + val
                    }, 0)
                    const taxRate = baseActiveTotals?.tax && baseActiveTotals?.subtotal
                      ? (baseActiveTotals.tax / baseActiveTotals.subtotal)
                      : 0
                    const newTax = Math.round(newSubtotal * taxRate)
                    return { ...baseActiveTotals, subtotal: newSubtotal, tax: newTax, total: newSubtotal + newTax }
                  })() : baseActiveTotals
                  return (
                    <>
                      {/* Desktop */}
                      <div className="hidden md:block">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b-2 border-gray-100">
                              <th className="text-left pb-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Description</th>
                              <th className="text-right pb-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide w-16">Qty</th>
                              <th className="text-right pb-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide w-24">Unit</th>
                              <th className="text-right pb-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide w-28">
                                Total
                                <span className="ml-1 text-[9px] font-normal text-gray-300 normal-case tracking-normal">(click to edit)</span>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {activeItems.map((item: any, i: number) => {
                              const displayTotal = lineItemOverrides[i] ?? item.total
                              const isEditing = editingLineItem === i
                              const isOverridden = lineItemOverrides[i] !== undefined
                              return (
                                <tr key={i} className="border-b border-gray-50 group">
                                  <td className="py-3 text-gray-700 pr-4">{item.description}</td>
                                  <td className="py-3 text-right text-gray-400 tabular-nums">{item.qty}</td>
                                  <td className="py-3 text-right text-gray-400 tabular-nums">${item.unitPrice}</td>
                                  <td className="py-3 text-right tabular-nums">
                                    {isEditing ? (
                                      <div className="flex items-center justify-end gap-1">
                                        <span className="text-gray-400 text-sm">$</span>
                                        <input
                                          type="number"
                                          value={editingValue}
                                          onChange={e => setEditingValue(e.target.value)}
                                          onBlur={() => handleLineItemEditCommit(i)}
                                          onKeyDown={e => handleLineItemEditKeyDown(e, i)}
                                          autoFocus
                                          className="w-20 text-right border border-blue-400 rounded-lg px-2 py-1 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50"
                                        />
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-end gap-1.5">
                                        {isOverridden && (
                                          <button
                                            type="button"
                                            title="Reset to original"
                                            onClick={e => handleResetLineItemOverride(e, i)}
                                            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all text-xs leading-none"
                                          >
                                            ↩
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          title="Click to edit"
                                          onClick={() => handleLineItemEditStart(i, displayTotal)}
                                          className={`font-semibold tabular-nums transition-colors hover:text-blue-600 cursor-pointer rounded px-1 py-0.5 hover:bg-blue-50 ${isOverridden ? 'text-blue-600' : 'text-gray-900'}`}
                                        >
                                          ${displayTotal}
                                        </button>
                                        {!isOverridden && (
                                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="opacity-0 group-hover:opacity-40 text-gray-400 flex-shrink-0">
                                            <path d="M7 1L9 3 3.5 8.5 1 9l.5-2.5L7 1z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                          </svg>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                      {/* Mobile */}
                      <div className="md:hidden space-y-2">
                        {activeItems.map((item: any, i: number) => {
                          const displayTotal = lineItemOverrides[i] ?? item.total
                          const isOverridden = lineItemOverrides[i] !== undefined
                          const isEditing = editingLineItem === i
                          return (
                            <div key={i} className="bg-gray-50 rounded-xl p-3.5">
                              <p className="text-sm font-medium text-gray-800 mb-2">{item.description}</p>
                              <div className="flex justify-between text-xs text-gray-400 items-center">
                                <span>Qty {item.qty} × ${item.unitPrice}</span>
                                {isEditing ? (
                                  <div className="flex items-center gap-1">
                                    <span className="text-gray-400">$</span>
                                    <input
                                      type="number"
                                      value={editingValue}
                                      onChange={e => setEditingValue(e.target.value)}
                                      onBlur={() => handleLineItemEditCommit(i)}
                                      onKeyDown={e => handleLineItemEditKeyDown(e, i)}
                                      autoFocus
                                      className="w-16 text-right border border-blue-400 rounded px-1.5 py-0.5 text-xs font-semibold text-gray-900 focus:outline-none bg-blue-50"
                                    />
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleLineItemEditStart(i, displayTotal)}
                                    className={`font-semibold transition-colors active:text-blue-600 ${isOverridden ? 'text-blue-600' : 'text-gray-900'}`}
                                  >
                                    ${displayTotal} ✎
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      {/* Totals */}
                      <div className="flex justify-end pt-2">
                        <div className="w-56 space-y-2 text-sm">
                          <div className="flex justify-between text-gray-500">
                            <span>Subtotal</span><span className="tabular-nums">${activeTotals?.subtotal}</span>
                          </div>
                          {(activeTotals?.tax ?? 0) > 0 && (
                            <div className="flex justify-between text-gray-500">
                              <span>Tax (est.)</span><span className="tabular-nums">${activeTotals?.tax}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-bold text-base pt-2.5 border-t-2 border-gray-100">
                            <span>Total</span>
                            <span className="text-[#2563EB] tabular-nums">${activeTotals?.total}</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )
                })()}

                {/* Inclusions & Exclusions */}
                {((quote.inclusions && quote.inclusions.length > 0) || (quote.exclusions && quote.exclusions.length > 0)) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {quote.inclusions && quote.inclusions.length > 0 && (
                      <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                        <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-2">✓ What&apos;s Included</p>
                        <ul className="space-y-1.5">
                          {quote.inclusions.map((item: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-green-800">
                              <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                              </svg>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {quote.exclusions && quote.exclusions.length > 0 && (
                      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-2">⚠ Not Included</p>
                        <ul className="space-y-1.5">
                          {quote.exclusions.map((item: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                              <svg className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                              </svg>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                {quote.notes && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1.5">Notes</p>
                    <p className="text-sm text-blue-800 leading-relaxed">{quote.notes}</p>
                  </div>
                )}

                {/* Footer */}
                <p className="text-center text-xs text-gray-300 pt-2 border-t border-gray-50">
                  {profile?.businessName || form.businessName} · Professional Estimate
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 flex-wrap">
              <button onClick={handleDownloadPDF}
                className="flex-1 min-w-[130px] flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold py-3 px-5 rounded-xl transition-colors text-sm shadow-md shadow-blue-200">
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                Download PDF
              </button>
              <button onClick={handleEmailQuote}
                className="flex-1 min-w-[130px] flex items-center justify-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-5 rounded-xl transition-all text-sm">
                {emailed ? (
                  <><svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg> Email opened!</>
                ) : (
                  <>
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    Email Quote
                    {form.clientEmail && (
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" title={`Pre-addressed to ${form.clientEmail}`} />
                    )}
                  </>
                )}
              </button>
              <button onClick={handleCopyQuote}
                aria-label="Copy quote to clipboard"
                className="flex items-center justify-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-all text-sm">
                {copied ? (
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                ) : (
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth={2}/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeWidth={2}/></svg>
                )}
              </button>
              <button onClick={() => setQuote(null)}
                className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 font-medium py-3 px-4 rounded-xl transition-colors text-sm flex items-center gap-1.5"
                title="Start a new quote">
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                </svg>
                New Quote
              </button>
            </div>

          </div>
        )}
      </div>

      {/* ── PAYWALL MODAL ────────────────────────────────────────────────────── */}
      {showPaywall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPaywall(false)} />

          {/* Card */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fade-in-up">
            {/* Close */}
            <button onClick={() => setShowPaywall(false)}
              className="absolute top-4 right-4 text-gray-300 hover:text-gray-500 transition-colors">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>

            {/* Icon */}
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-5 mx-auto">
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <path d="M14 2L4 14h8l-2 10 14-16H14V2z" fill="#2563EB"/>
              </svg>
            </div>

            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">You've used your 3 free quotes</h2>
            <p className="text-gray-500 text-sm text-center leading-relaxed mb-4">
              Join as a <span className="font-semibold text-amber-600">founding member</span> and lock in $9/mo forever — before we go public at $19.
            </p>

            {/* Founder badge */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4 text-center">
              <span className="text-xs font-semibold text-amber-700">🔥 Founder Pricing — First 50 users lock in $9/mo forever</span>
            </div>

            {/* What's included */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2">
              {[
                'Unlimited quotes — no monthly cap',
                'Branded PDF downloads',
                'Calibrated to your exact rates & trade',
                'Quote history & win/loss tracking',
                'Price locked in forever — never increases',
              ].map(f => (
                <div key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                  </svg>
                  {f}
                </div>
              ))}
            </div>

            {/* Price + CTA */}
            <div className="text-center mb-4">
              <div className="flex items-baseline justify-center gap-1 mb-0.5">
                <span className="text-gray-400 text-base">$</span>
                <span className="text-3xl font-bold text-gray-900">9</span>
                <span className="text-gray-400 text-base">/month</span>
                <span className="text-xs text-gray-400 line-through ml-1">$19</span>
              </div>
              <p className="text-xs text-gray-400 mb-4">Locked in forever · Cancel anytime · Secured by Stripe</p>
              <button
                onClick={handleUpgrade}
                disabled={upgrading}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-70 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm shadow-sm flex items-center justify-center gap-2">
                {upgrading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Redirecting to checkout…
                  </>
                ) : (
                  <>🔥 Claim Founder Spot — $9/mo</>
                )}
              </button>
            </div>

            <button onClick={() => setShowPaywall(false)}
              className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors py-1">
              Maybe later
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
