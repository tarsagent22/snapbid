import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const TRADE_RATES: Record<string, number> = {
  plumbing: 95,
  electrical: 105,
  painting: 55,
  landscaping: 60,
  hvac: 110,
  roofing: 75,
  carpentry: 70,
  flooring: 65,
  general: 85,
  handyman: 65,
  cleaning: 45,
  other: 75,
}

export async function POST(req: NextRequest) {
  try {
    const { businessName, trade, clientName, clientAddress, jobDescription, yourRate } = await req.json()

    const hourlyRate = yourRate ? parseFloat(yourRate) : (TRADE_RATES[trade] || 75)
    const quoteNum = `SB-${Math.floor(1000 + Math.random() * 9000)}`

    const prompt = `You are an expert contractor estimator. Generate a professional quote breakdown for the following job.

Business: ${businessName}
Trade: ${trade}
Client: ${clientName}
Address: ${clientAddress}
Job Description: ${jobDescription}
Hourly Rate: $${hourlyRate}/hr

Return a JSON object with this exact structure (no markdown, no extra text, just raw JSON):
{
  "quoteNumber": "${quoteNum}",
  "lineItems": [
    {
      "description": "specific task name",
      "qty": "number or string like '2 hrs' or '1 unit'",
      "unitPrice": 0,
      "total": 0
    }
  ],
  "subtotal": 0,
  "tax": 0,
  "total": 0,
  "notes": "1-2 sentences about payment terms or warranty"
}

Rules:
- Break job into 2-5 specific line items
- Use realistic market pricing for ${trade}
- Keep totals mathematically consistent (subtotal + tax = total)
- Notes should sound professional
- Return ONLY valid JSON`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0].type === 'text' ? message.content[0].text : ''
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const quoteData = JSON.parse(cleaned)

    return NextResponse.json(quoteData)
  } catch (err: any) {
    console.error('Quote generation error:', err)
    return NextResponse.json({ error: err.message || 'Failed to generate quote' }, { status: 500 })
  }
}
