import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getProfile, saveProfile, ContractorProfile } from '@/lib/profile'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = getProfile(userId)
  return NextResponse.json({ profile })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const existing = getProfile(userId)

  const profile: ContractorProfile = {
    userId,
    businessName: body.businessName || '',
    trade: body.trade || 'general',
    hourlyRate: parseFloat(body.hourlyRate) || 75,
    region: body.region || 'national',
    materialTier: body.materialTier || 'standard',
    crewSize: parseInt(body.crewSize) || 1,
    markup: parseFloat(body.markup) || 20,
    quoteCount: existing?.quoteCount || 0,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  saveProfile(profile)
  return NextResponse.json({ profile })
}
