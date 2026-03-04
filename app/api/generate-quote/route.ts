import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@clerk/nextjs/server'
import { getProfile, incrementQuoteCount, saveQuoteToHistory } from '@/lib/profile'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const TRADE_RATES: Record<string, number> = {
  plumbing: 95, electrical: 105, painting: 55, landscaping: 60,
  hvac: 110, roofing: 75, carpentry: 70, flooring: 65,
  general: 85, handyman: 65, cleaning: 45, other: 75,
}

const REGION_MULTIPLIERS: Record<string, number> = {
  northeast: 1.25, west: 1.20, mountain: 1.05,
  midwest: 0.95, southeast: 0.90, southwest: 1.00, national: 1.00,
}

const MATERIAL_MULTIPLIERS: Record<string, number> = {
  budget: 0.75, standard: 1.0, premium: 1.45,
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { jobDescription, clientName, clientAddress, materialTierOverride } = body

    // Try to get profile for logged-in users
    const { userId } = await auth()
    let profile = userId ? await getProfile(userId) : null

    // Fall back to form-provided values if no profile
    const businessName = profile?.businessName || body.businessName || 'My Business'
    const trade = profile?.trade || body.trade || 'general'
    const hourlyRate = profile?.hourlyRate || parseFloat(body.yourRate) || TRADE_RATES[trade] || 75
    const region = profile?.region || 'national'
    const materialTier = materialTierOverride || profile?.materialTier || 'standard'
    const crewSize = profile?.crewSize || 1
    const markup = profile?.markup || 20

    const regionMultiplier = REGION_MULTIPLIERS[region] || 1.0
    const materialMultiplier = MATERIAL_MULTIPLIERS[materialTier] || 1.0
    const adjustedRate = Math.round(hourlyRate * regionMultiplier)
    const taxRate = profile?.taxRate ?? 8.5
    const paymentTerms = profile?.paymentTerms || '50-deposit'
    const quoteValidityDays = profile?.quoteValidityDays || 30
    const yearsInBusiness = profile?.yearsInBusiness || ''
    const specialties = profile?.specialties || ''
    const introMessage = profile?.introMessage || ''

    const PAYMENT_TERMS_LABELS: Record<string, string> = {
      '50-deposit': '50% deposit required to begin, balance due on completion',
      '30-deposit': '30% deposit required to begin, balance due on completion',
      'on-completion': 'Full payment due on completion of work',
      'net-15': 'Payment due within 15 days of invoice',
      'net-30': 'Payment due within 30 days of invoice',
      'full-upfront': 'Full payment required prior to work beginning',
      'custom': 'Payment terms as discussed',
    }

    const quoteNum = `SB-${Math.floor(1000 + Math.random() * 9000)}`

    const prompt = `You are an expert contractor estimator. Generate a professional, accurate quote for this job.

Business: ${businessName}
Trade: ${trade}
${specialties ? `Specialties: ${specialties}` : ''}
${yearsInBusiness ? `Experience: ${yearsInBusiness} years in business` : ''}
Client: ${clientName}
Address: ${clientAddress}
Job Description: ${jobDescription}

Contractor's actual numbers:
- Hourly labor rate: $${adjustedRate}/hr (already adjusted for ${region} region)
- Crew size: ${crewSize} person(s)
- Material quality tier: ${materialTier} (multiplier: ${materialMultiplier}x standard pricing)
- Markup on materials: ${markup}%
- Tax rate: ${taxRate}% (materials only)
- Payment terms: ${PAYMENT_TERMS_LABELS[paymentTerms] || paymentTerms}
- Quote valid for: ${quoteValidityDays} days

Instructions:
- Break the job into 2-6 specific line items (labor hours, materials by type, etc.)
- Use the contractor's ACTUAL hourly rate for all labor — do not substitute generic rates
- Apply the material tier multiplier to all material costs
- Add markup percentage on top of material costs
- Keep totals mathematically accurate
- Tax: apply only to materials at ${taxRate}% rate
- Notes: mention payment terms (${PAYMENT_TERMS_LABELS[paymentTerms]}), quote validity (${quoteValidityDays} days)${yearsInBusiness ? `, reference experience if relevant` : ''}. Professional tone, 2-3 sentences max.
${introMessage ? `- The contractor has a custom intro message to incorporate naturally: "${introMessage}"` : ''}

Return ONLY valid JSON, no markdown:
{
  "quoteNumber": "${quoteNum}",
  "lineItems": [
    { "description": "string", "qty": "string", "unitPrice": number, "total": number }
  ],
  "subtotal": number,
  "tax": number,
  "total": number,
  "notes": "string"
}`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0].type === 'text' ? message.content[0].text : ''
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const quoteData = JSON.parse(cleaned)

    // Round all money values to nearest $50 — contractors quote in round numbers,
    // and clients trust "$1,400" more than "$1,402.30"
    const round50 = (n: number) => Math.round(n / 50) * 50

    if (Array.isArray(quoteData.lineItems)) {
      quoteData.lineItems = quoteData.lineItems.map((item: any) => ({
        ...item,
        unitPrice: round50(parseFloat(item.unitPrice) || 0),
        total: round50(parseFloat(item.total) || 0),
      }))
    }
    // Recompute subtotal from rounded line items, then round tax and total
    const subtotal = (quoteData.lineItems || []).reduce(
      (sum: number, item: any) => sum + (parseFloat(item.total) || 0), 0
    )
    const quotedTaxRate = parseFloat(quoteData.taxRate) || taxRate || 0
    const tax = round50(subtotal * (quotedTaxRate / 100))
    quoteData.subtotal = subtotal
    quoteData.tax = tax
    quoteData.total = subtotal + tax

    // Track quote count and save to history
    if (userId) {
      const count = await incrementQuoteCount(userId)
      quoteData.quoteCount = count
      quoteData.isOverLimit = count > 3

      // Save to history (fire-and-forget, don't block response)
      const body = await req.clone().json().catch(() => ({}))
      saveQuoteToHistory(userId, {
        id: quoteData.quoteNumber || `Q-${Date.now()}`,
        createdAt: new Date().toISOString(),
        clientName: body.clientName || '',
        clientAddress: body.clientAddress || '',
        jobDescription: body.jobDescription || '',
        total: quoteData.total,
        subtotal: quoteData.subtotal,
        tax: quoteData.tax,
        lineItems: quoteData.lineItems || [],
        notes: quoteData.notes || '',
        quoteNumber: quoteData.quoteNumber || '',
      }).catch(console.error)
    }

    return NextResponse.json(quoteData)
  } catch (err: any) {
    console.error('Quote generation error:', err)
    return NextResponse.json({ error: err.message || 'Failed to generate quote' }, { status: 500 })
  }
}
