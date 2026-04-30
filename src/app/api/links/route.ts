import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { auth } from '@/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id || session.user.email || ''
    const slugs = await redis.smembers(`user:${userId}:links`)

    if (!slugs || slugs.length === 0) {
      return NextResponse.json({ links: [] })
    }

    const links = await Promise.all(
      slugs.map(async (slug) => {
        const raw = await redis.get<string>(`url:${slug}`)
        if (!raw) return null
        const data = typeof raw === 'string' ? JSON.parse(raw) : raw
        return { slug, ...data }
      })
    )

    const validLinks = links
      .filter(Boolean)
      .sort((a: any, b: any) => b.createdAt - a.createdAt)

    return NextResponse.json({ links: validLinks })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}