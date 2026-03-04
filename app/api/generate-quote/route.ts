import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@clerk/nextjs/server'
import { getProfile, incrementQuoteCount } from '@/lib/profile'

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
    let profile = userId ? getProfile(userId) : null

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

    const quoteNum = `SB-${Math.floor(1000 + Math.random() * 9000)}`

    const prompt = `You are an expert contractor estimator. Generate a professional, accurate quote for this job.

Business: ${businessName}
Trade: ${trade}
Client: ${clientName}
Address: ${clientAddress}
Job Description: ${jobDescription}

Contractor's actual numbers:
- Hourly labor rate: $${adjustedRate}/hr (already adjusted for ${region} region)
- Crew size: ${crewSize} person(s)
- Material quality tier: ${materialTier} (multiplier: ${materialMultiplier}x standard pricing)
- Markup on materials: ${markup}%

Instructions:
- Break the job into 2-6 specific line items (labor hours, materials by type, etc.)
- Use the contractor's ACTUAL hourly rate for all labor — do not substitute generic rates
- Apply the material tier multiplier to all material costs
- Add markup percentage on top of material costs
- Keep totals mathematically accurate (subtotal + tax = total)
- Tax: apply only to materials (not labor), use ~8% rate
- Notes: 1-2 sentences on payment terms or warranty, professional tone

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

    // Track quote count for paywall
    if (userId) {
      const count = incrementQuoteCount(userId)
      quoteData.quoteCount = count
      quoteData.isOverLimit = count > 3
    }

    return NextResponse.json(quoteData)
  } catch (err: any) {
    console.error('Quote generation error:', err)
    return NextResponse.json({ error: err.message || 'Failed to generate quote' }, { status: 500 })
  }
}
