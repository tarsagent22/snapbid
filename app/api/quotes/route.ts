import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getQuoteHistory, saveQuoteToHistory, updateQuoteStatus, SavedQuote } from '@/lib/profile'

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

export async function PATCH(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, status } = await req.json()
  if (!id || !['pending', 'won', 'lost'].includes(status)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  await updateQuoteStatus(userId, id, status as 'pending' | 'won' | 'lost')
  return NextResponse.json({ ok: true })
}
