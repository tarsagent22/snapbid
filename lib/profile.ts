/**
 * Profile storage via Clerk private metadata.
 */

import { clerkClient } from '@clerk/nextjs/server'

export interface SavedLineItem {
  id: string
  description: string
  defaultQty: string
  defaultUnitPrice: number
  category: 'labor' | 'material' | 'other'
}

export interface ContractorProfile {
  userId: string
  businessName: string
  trade: string
  hourlyRate: number
  region: string
  materialTier: 'budget' | 'standard' | 'premium'
  crewSize: number
  markup: number
  quoteCount: number
  createdAt: string
  updatedAt: string
  // Contact & identity
  phone?: string
  email?: string
  businessAddress?: string
  licenseNumber?: string
  yearsInBusiness?: string
  specialties?: string
  taxRate?: number
  paymentTerms?: string
  quoteValidityDays?: number
  introMessage?: string
  logoDataUrl?: string
  // Business mechanics
  minimumJobCharge?: number
  tripCharge?: number
  pricingModel?: 'flat-rate' | 'time-and-materials' | 'cost-plus'
  offerTieredOptions?: boolean
  afterHoursRate?: number
  // Trade-specific rates
  fixtureRate?: number        // plumbing: per-fixture flat rate
  panelWorkRate?: number      // electrical: panel/service rate
  permitFeeTypical?: number   // electrical: typical permit cost
  sqftRateInterior?: number   // painting: interior $/sqft
  sqftRateExterior?: number   // painting: exterior $/sqft
  sqftRateRoofing?: number    // roofing: $/sqft
  tearOffRate?: number        // roofing: tear-off $/sqft
  serviceCallRate?: number    // hvac: flat service call
  // Saved line items library
  savedLineItems?: SavedLineItem[]
}

export async function getProfile(userId: string): Promise<ContractorProfile | null> {
  try {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const profile = user.privateMetadata?.contractorProfile as ContractorProfile | undefined
    return profile ?? null
  } catch {
    return null
  }
}

export async function saveProfile(profile: ContractorProfile): Promise<void> {
  profile.updatedAt = new Date().toISOString()
  const client = await clerkClient()
  await client.users.updateUserMetadata(profile.userId, {
    privateMetadata: {
      contractorProfile: profile,
    },
  })
}

export async function incrementQuoteCount(userId: string): Promise<number> {
  const profile = await getProfile(userId)
  if (!profile) return 0
  profile.quoteCount = (profile.quoteCount || 0) + 1
  await saveProfile(profile)
  return profile.quoteCount
}

// ── Quote history ─────────────────────────────────────────────────────────────

export interface SavedQuote {
  id: string
  createdAt: string
  clientName: string
  clientAddress: string
  jobDescription: string
  total: number
  lineItems: Array<{ description: string; qty: number; unitPrice: number; total: number }>
  subtotal: number
  tax: number
  notes?: string
  quoteNumber: string
}

export async function getQuoteHistory(userId: string): Promise<SavedQuote[]> {
  try {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    return (user.privateMetadata?.quoteHistory as SavedQuote[]) ?? []
  } catch {
    return []
  }
}

export async function saveQuoteToHistory(userId: string, quote: SavedQuote): Promise<void> {
  const history = await getQuoteHistory(userId)
  const updated = [quote, ...history].slice(0, 50)
  const client = await clerkClient()
  await client.users.updateUserMetadata(userId, {
    privateMetadata: {
      quoteHistory: updated,
    },
  })
}
