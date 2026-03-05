import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getProfile, saveProfile } from '@/lib/profile'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { logoDataUrl } = await req.json()

  // Basic validation — must be a data URL image
  if (logoDataUrl && !logoDataUrl.startsWith('data:image/')) {
    return NextResponse.json({ error: 'Invalid image format' }, { status: 400 })
  }

  // Clerk metadata has a ~8KB limit per key — resize is handled client-side
  // Detect format for validation/logging
  const fmt = logoDataUrl?.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG'
  // 12000 chars ≈ ~9KB base64 — stays safely within Clerk metadata limits
  if (logoDataUrl && logoDataUrl.length > 12000) {
    return NextResponse.json({ error: 'Image too large after compression. Please use a smaller or simpler logo.' }, { status: 400 })
  }
  void fmt // used for format detection above

  const profile = await getProfile(userId)
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  profile.logoDataUrl = logoDataUrl || undefined
  await saveProfile(profile)

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await getProfile(userId)
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  delete profile.logoDataUrl
  await saveProfile(profile)

  return NextResponse.json({ ok: true })
}
