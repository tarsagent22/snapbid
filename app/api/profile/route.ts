import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getProfile, saveProfile, ContractorProfile } from '@/lib/profile'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const profile = await getProfile(userId)
  return NextResponse.json({ profile })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const existing = await getProfile(userId)

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
    // Contact & identity
    phone: body.phone || '',
    email: body.email || '',
    businessAddress: body.businessAddress || '',
    licenseNumber: body.licenseNumber || '',
    yearsInBusiness: body.yearsInBusiness || '',
    specialties: body.specialties || '',
    taxRate: parseFloat(body.taxRate) || 8.5,
    paymentTerms: body.paymentTerms || '50-deposit',
    quoteValidityDays: parseInt(body.quoteValidityDays) || 30,
    introMessage: body.introMessage || '',
    notesTemplate: body.notesTemplate || '',
    logoDataUrl: existing?.logoDataUrl,
    // Business mechanics
    minimumJobCharge: parseFloat(body.minimumJobCharge) || undefined,
    tripCharge: parseFloat(body.tripCharge) || undefined,
    pricingModel: body.pricingModel || 'time-and-materials',
    offerTieredOptions: body.offerTieredOptions === true || body.offerTieredOptions === 'true',
    afterHoursRate: parseFloat(body.afterHoursRate) || undefined,
    // Trade-specific
    fixtureRate: parseFloat(body.fixtureRate) || undefined,
    panelWorkRate: parseFloat(body.panelWorkRate) || undefined,
    permitFeeTypical: parseFloat(body.permitFeeTypical) || undefined,
    sqftRateInterior: parseFloat(body.sqftRateInterior) || undefined,
    sqftRateExterior: parseFloat(body.sqftRateExterior) || undefined,
    sqftRateRoofing: parseFloat(body.sqftRateRoofing) || undefined,
    tearOffRate: parseFloat(body.tearOffRate) || undefined,
    serviceCallRate: parseFloat(body.serviceCallRate) || undefined,
    // Saved line items
    savedLineItems: Array.isArray(body.savedLineItems) ? body.savedLineItems : (existing?.savedLineItems || []),
    // Quote display settings
    showMarkupOnQuote: body.showMarkupOnQuote === true || body.showMarkupOnQuote === 'true',
  }

  await saveProfile(profile)
  return NextResponse.json({ profile })
}
