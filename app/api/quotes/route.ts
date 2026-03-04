import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getQuoteHistory, saveQuoteToHistory, SavedQuote } from '@/lib/profile'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const history = await getQuoteHistory(userId)
  return NextResponse.json({ history })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const quote: SavedQuote = await req.json()
  await saveQuoteToHistory(userId, quote)
  return NextResponse.json({ ok: true })
}
