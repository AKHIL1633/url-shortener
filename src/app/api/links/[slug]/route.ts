import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { auth } from '@/auth'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params
    const userId = session.user.id || session.user.email || ''

    await Promise.all([
      redis.del(`url:${slug}`),
      redis.del(`analytics:${slug}`),
      redis.srem(`user:${userId}:links`, slug),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}