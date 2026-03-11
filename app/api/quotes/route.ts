import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getQuoteHistory, saveQuoteToHistory, updateQuoteStatus, SavedQuote } from '@/lib/profile'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const history = await getQuoteHistory(userId)
    return NextResponse.json({ history })
  } catch (err: any) {
    console.error('Quotes GET error:', err)
    return NextResponse.json({ error: err.message || 'Failed to load quotes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const quote: SavedQuote = await req.json()
    await saveQuoteToHistory(userId, quote)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Quotes POST error:', err)
    return NextResponse.json({ error: err.message || 'Failed to save quote' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id, status } = await req.json()
    if (!id || !['pending', 'won', 'lost'].includes(status)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    await updateQuoteStatus(userId, id, status as 'pending' | 'won' | 'lost')
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Quotes PATCH error:', err)
    return NextResponse.json({ error: err.message || 'Failed to update quote status' }, { status: 500 })
  }
}
