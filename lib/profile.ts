// Simple file-based profile store using Vercel's filesystem
// In production this should be replaced with a database (PlanetScale, Supabase, etc.)
// For MVP: store profiles as JSON in /tmp keyed by userId — persists within a deployment

import fs from 'fs'
import path from 'path'

const PROFILES_DIR = '/tmp/snapbid-profiles'

export interface ContractorProfile {
  userId: string
  businessName: string
  trade: string
  hourlyRate: number
  region: string
  materialTier: 'budget' | 'standard' | 'premium'
  crewSize: number
  markup: number // percentage e.g. 20 = 20%
  quoteCount: number
  createdAt: string
  updatedAt: string
}

function ensureDir() {
  if (!fs.existsSync(PROFILES_DIR)) {
    fs.mkdirSync(PROFILES_DIR, { recursive: true })
  }
}

export function getProfile(userId: string): ContractorProfile | null {
  ensureDir()
  const file = path.join(PROFILES_DIR, `${userId}.json`)
  if (!fs.existsSync(file)) return null
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

export function saveProfile(profile: ContractorProfile): void {
  ensureDir()
  const file = path.join(PROFILES_DIR, `${profile.userId}.json`)
  profile.updatedAt = new Date().toISOString()
  fs.writeFileSync(file, JSON.stringify(profile, null, 2))
}

export function incrementQuoteCount(userId: string): number {
  const profile = getProfile(userId)
  if (!profile) return 0
  profile.quoteCount = (profile.quoteCount || 0) + 1
  saveProfile(profile)
  return profile.quoteCount
}
