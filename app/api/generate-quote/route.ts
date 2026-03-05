import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@clerk/nextjs/server'
import { getProfile, getSubscriptionStatus, incrementQuoteCount, saveQuoteToHistory } from '@/lib/profile'

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

const PAYMENT_TERMS_LABELS: Record<string, string> = {
  '50-deposit': '50% deposit required to begin, balance due on completion',
  '30-deposit': '30% deposit required to begin, balance due on completion',
  'on-completion': 'Full payment due on completion of work',
  'net-15': 'Payment due within 15 days of invoice',
  'net-30': 'Payment due within 30 days of invoice',
  'full-upfront': 'Full payment required prior to work beginning',
  'custom': 'Payment terms as discussed',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      jobDescription, clientName, clientAddress, clientEmail, materialTierOverride,
      jobType, propertyType, accessDifficulty,
    } = body

    const { userId } = await auth()
    const profile = userId ? await getProfile(userId) : null
    const isSubscribed = userId ? await getSubscriptionStatus(userId) : false

    // Enforce free tier limit (3 quotes) for authenticated non-subscribed users
    const FREE_QUOTA = 3
    if (userId && !isSubscribed && (profile?.quoteCount ?? 0) >= FREE_QUOTA) {
      return NextResponse.json(
        { error: 'limit_reached', upgradeUrl: '/upgrade' },
        { status: 402 }
      )
    }

    // Core pricing params
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

    // New business mechanics
    const minimumJobCharge = profile?.minimumJobCharge
    const tripCharge = profile?.tripCharge
    const pricingModel = profile?.pricingModel || 'time-and-materials'
    const offerTieredOptions = profile?.offerTieredOptions || false
    const afterHoursRate = profile?.afterHoursRate
    const savedLineItems = profile?.savedLineItems || []

    // Trade-specific
    const fixtureRate = profile?.fixtureRate
    const panelWorkRate = profile?.panelWorkRate
    const permitFeeTypical = profile?.permitFeeTypical
    const sqftRateInterior = profile?.sqftRateInterior
    const sqftRateExterior = profile?.sqftRateExterior
    const sqftRateRoofing = profile?.sqftRateRoofing
    const tearOffRate = profile?.tearOffRate
    const serviceCallRate = profile?.serviceCallRate

    // Emergency detection
    const isEmergency = jobType === 'emergency' || /emergency|urgent|after.?hour|same.?day/i.test(jobDescription || '')
    const effectiveHourlyRate = (isEmergency && afterHoursRate) ? afterHoursRate : adjustedRate

    const quoteNum = `SB-${Math.floor(1000 + Math.random() * 9000)}`

    // Build trade-specific rates block
    const tradeRatesLines: string[] = []
    if (trade === 'plumbing' && fixtureRate) tradeRatesLines.push(`- Per-fixture flat rate: $${fixtureRate} (toilets, faucets, valves — use this instead of hourly for fixture swaps)`)
    if (trade === 'electrical') {
      if (panelWorkRate) tradeRatesLines.push(`- Panel/service work rate: $${panelWorkRate}/hr (use for panel upgrades, service calls)`)
      if (permitFeeTypical) tradeRatesLines.push(`- Typical permit fee: $${permitFeeTypical} (add as separate line item when permits are required)`)
    }
    if (trade === 'painting') {
      if (sqftRateInterior) tradeRatesLines.push(`- Interior painting: $${sqftRateInterior}/sq ft`)
      if (sqftRateExterior) tradeRatesLines.push(`- Exterior painting: $${sqftRateExterior}/sq ft`)
    }
    if (trade === 'roofing') {
      if (sqftRateRoofing) tradeRatesLines.push(`- Roofing installation: $${sqftRateRoofing}/sq ft`)
      if (tearOffRate) tradeRatesLines.push(`- Tear-off / removal: $${tearOffRate}/sq ft (add if removing existing material)`)
    }
    if (trade === 'hvac' && serviceCallRate) tradeRatesLines.push(`- Service call flat rate: $${serviceCallRate} (add as first line item for diagnostic/service visits)`)
    const tradeRatesSection = tradeRatesLines.length > 0 ? `\nTrade-specific rates:\n${tradeRatesLines.join('\n')}` : ''

    // Saved line items hint
    const savedItemsHint = savedLineItems.length > 0
      ? `\nContractor's saved line items (use these descriptions/prices as a reference when applicable):\n${savedLineItems.slice(0, 10).map((item) => `- ${item.description}: $${item.defaultUnitPrice} (${item.category})`).join('\n')}`
      : ''

    // Job context
    const jobContextLines = [
      jobType ? `Job type: ${jobType.replace(/-/g, ' ')}` : '',
      propertyType ? `Property type: ${propertyType}` : '',
      accessDifficulty && accessDifficulty !== 'easy' ? `Access difficulty: ${accessDifficulty} — factor in extra labor time` : '',
      isEmergency ? `⚠️ EMERGENCY/AFTER-HOURS JOB — use after-hours rate of $${effectiveHourlyRate}/hr` : '',
    ].filter(Boolean)
    const jobContextSection = jobContextLines.length > 0 ? `\nJob Context:\n${jobContextLines.join('\n')}` : ''

    // Pricing model instructions
    const pricingModelInstructions: Record<string, string> = {
      'flat-rate': 'FLAT RATE — use flat prices per item/unit, not hourly breakdowns. Each line item is a fixed price.',
      'time-and-materials': 'TIME & MATERIALS — break out labor hours and materials as separate line items.',
      'cost-plus': 'COST-PLUS — show actual material cost + markup as distinct values in description (e.g. "Materials: $200 + 20% markup = $240").',
    }

    const prompt = `You are an expert contractor estimator. Generate a professional, accurate quote.

Business: ${businessName}
Trade: ${trade}
${specialties ? `Specialties: ${specialties}` : ''}
${yearsInBusiness ? `Experience: ${yearsInBusiness} years in business` : ''}
Client: ${clientName}
Address: ${clientAddress}
Job Description: ${jobDescription}
${jobContextSection}

Contractor's pricing parameters:
- Hourly labor rate: $${effectiveHourlyRate}/hr (adjusted for ${region} region${isEmergency ? ' — EMERGENCY RATE APPLIED' : ''})
- Crew size: ${crewSize} person(s)
- Material quality tier: ${materialTier} (${materialMultiplier}x standard pricing)
- Markup on materials: ${markup}%
- Tax rate: ${taxRate}% (materials only)
- Payment terms: ${PAYMENT_TERMS_LABELS[paymentTerms] || paymentTerms}
- Quote valid for: ${quoteValidityDays} days
${minimumJobCharge ? `- Minimum job charge: $${minimumJobCharge} — if total would be below this, add a minimum charge line item` : ''}
${tripCharge ? `- Trip/service charge: $${tripCharge} — add as first line item when a service call or travel is involved` : ''}
${tradeRatesSection}
${savedItemsHint}

Quote format: ${pricingModelInstructions[pricingModel] || pricingModelInstructions['time-and-materials']}

Instructions:
- Break the job into ${offerTieredOptions ? '3 complete option tiers (see below)' : '2-6 specific line items'}
- Use contractor's ACTUAL rates above — never substitute generic industry rates
- Apply material tier multiplier to all material costs
- Add markup % on top of material costs
- Tax at ${taxRate}% on materials only
${accessDifficulty === 'difficult' ? '- Access is DIFFICULT — add 20-30% to all labor time estimates' : accessDifficulty === 'moderate' ? '- Access is MODERATE — add 10-15% to labor time' : ''}
${minimumJobCharge ? `- If total is under $${minimumJobCharge}, add a "Minimum service charge" line item to reach the minimum` : ''}
- Notes: payment terms, quote validity${yearsInBusiness ? ', reference experience if relevant' : ''}. Professional, 2-3 sentences max.
${introMessage ? `- Incorporate this contractor message naturally: "${introMessage}"` : ''}
- scopeOfWork: Write 1-2 sentences describing what work will be performed and what the client receives. This is the "what you're getting" summary shown at the top of the quote. Be specific (mention key tasks/materials), professional, and client-facing. Do NOT repeat pricing or payment terms here.
- inclusions: Array of 3-5 short strings (plain phrases, no bullet chars) stating exactly what IS included in this quote price. Be specific to this job (e.g. "All labor and materials", "Site cleanup and debris removal", "Drywall patching after rough-in"). These help clients understand what they're paying for and prevent scope disputes.
- exclusions: Array of 2-4 short strings stating what is NOT included or what could change the price (e.g. "Permits not included — estimated $X if required", "Additional repairs if hidden damage found", "Paint or finish work unless specified"). Be specific to this trade and job type.

${offerTieredOptions ? `TIERED QUOTE MODE — Generate 3 complete option sets:
- "budget": Lower-cost materials, essential work only, minimal extras
- "standard": Mid-range materials, full scope as described
- "premium": Best materials, extra attention to detail, longevity-focused
Each tier must have its own complete lineItems array, subtotal, tax, and total.
` : ''}

Return ONLY valid JSON, no markdown:
${offerTieredOptions ? `{
  "quoteNumber": "${quoteNum}",
  "tiered": true,
  "scopeOfWork": "string",
  "inclusions": ["string"],
  "exclusions": ["string"],
  "tiers": {
    "budget": { "label": "Budget", "lineItems": [{ "description": "string", "qty": "string", "unitPrice": number, "total": number }], "subtotal": number, "tax": number, "total": number },
    "standard": { "label": "Standard", "lineItems": [{ "description": "string", "qty": "string", "unitPrice": number, "total": number }], "subtotal": number, "tax": number, "total": number },
    "premium": { "label": "Premium", "lineItems": [{ "description": "string", "qty": "string", "unitPrice": number, "total": number }], "subtotal": number, "tax": number, "total": number }
  },
  "notes": "string"
}` : `{
  "quoteNumber": "${quoteNum}",
  "scopeOfWork": "string",
  "inclusions": ["string"],
  "exclusions": ["string"],
  "lineItems": [{ "description": "string", "qty": "string", "unitPrice": number, "total": number }],
  "subtotal": number,
  "tax": number,
  "total": number,
  "notes": "string"
}`}`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: offerTieredOptions ? 2600 : 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0].type === 'text' ? message.content[0].text : ''
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const quoteData = JSON.parse(cleaned)

    const round50 = (n: number) => Math.round(n / 50) * 50

    if (quoteData.tiered && quoteData.tiers) {
      // Round all tiers
      for (const tierKey of Object.keys(quoteData.tiers)) {
        const tier = quoteData.tiers[tierKey]
        if (Array.isArray(tier.lineItems)) {
          tier.lineItems = tier.lineItems.map((item: any) => ({
            ...item,
            unitPrice: round50(parseFloat(item.unitPrice) || 0),
            total: round50(parseFloat(item.total) || 0),
          }))
        }
        const tierSubtotal = (tier.lineItems || []).reduce((s: number, i: any) => s + (parseFloat(i.total) || 0), 0)
        const tierTax = round50(tierSubtotal * (taxRate / 100))
        tier.subtotal = tierSubtotal
        tier.tax = tierTax
        tier.total = tierSubtotal + tierTax
      }
      // Set top-level total from standard tier for history tracking
      quoteData.subtotal = quoteData.tiers.standard?.subtotal || 0
      quoteData.tax = quoteData.tiers.standard?.tax || 0
      quoteData.total = quoteData.tiers.standard?.total || 0
    } else {
      // Standard rounding
      if (Array.isArray(quoteData.lineItems)) {
        quoteData.lineItems = quoteData.lineItems.map((item: any) => ({
          ...item,
          unitPrice: round50(parseFloat(item.unitPrice) || 0),
          total: round50(parseFloat(item.total) || 0),
        }))
      }
      const subtotal = (quoteData.lineItems || []).reduce(
        (sum: number, item: any) => sum + (parseFloat(item.total) || 0), 0
      )
      const tax = round50(subtotal * (taxRate / 100))
      quoteData.subtotal = subtotal
      quoteData.tax = tax
      quoteData.total = subtotal + tax
    }

    // Track and save
    if (userId) {
      // Only increment count for free-tier users (subscribed users have unlimited quotes)
      if (!isSubscribed) {
        const count = await incrementQuoteCount(userId)
        quoteData.quoteCount = count
        quoteData.isOverLimit = count >= FREE_QUOTA
      } else {
        quoteData.quoteCount = profile?.quoteCount ?? 0
        quoteData.isOverLimit = false
      }
      quoteData.isSubscribed = isSubscribed

      saveQuoteToHistory(userId, {
        id: quoteData.quoteNumber || `Q-${Date.now()}`,
        createdAt: new Date().toISOString(),
        clientName: body.clientName || '',
        clientAddress: body.clientAddress || '',
        clientEmail: body.clientEmail || '',
        jobDescription: body.jobDescription || '',
        total: quoteData.total,
        subtotal: quoteData.subtotal,
        tax: quoteData.tax,
        lineItems: quoteData.tiered ? (quoteData.tiers?.standard?.lineItems || []) : (quoteData.lineItems || []),
        notes: quoteData.notes || '',
        quoteNumber: quoteData.quoteNumber || '',
        scopeOfWork: quoteData.scopeOfWork || '',
        inclusions: quoteData.inclusions || [],
        exclusions: quoteData.exclusions || [],
      }).catch(console.error)
    }

    return NextResponse.json(quoteData)
  } catch (err: any) {
    console.error('Quote generation error:', err)
    return NextResponse.json({ error: err.message || 'Failed to generate quote' }, { status: 500 })
  }
}
