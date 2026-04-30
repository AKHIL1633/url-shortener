import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

interface LinkData {
  url: string
  createdAt: number
  clicks: number
  burnAfterRead: boolean
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const raw = await redis.get<string>(`url:${slug}`)

    if (!raw) {
      return NextResponse.json({ error: 'Link not found or expired' }, { status: 404 })
    }

    const linkData: LinkData = typeof raw === 'string' ? JSON.parse(raw) : raw

    if (linkData.burnAfterRead) {
      await redis.del(`url:${slug}`)
    } else {
      linkData.clicks += 1
      const country = req.headers.get('x-vercel-ip-country') ?? 'Unknown'
      const city = req.headers.get('x-vercel-ip-city') ?? 'Unknown'

      await Promise.all([
        redis.set(`url:${slug}`, JSON.stringify(linkData)),
        redis.lpush(`analytics:${slug}`, JSON.stringify({
          timestamp: Date.now(),
          country,
          city,
        })),
        redis.ltrim(`analytics:${slug}`, 0, 99),
      ])
    }

    return NextResponse.redirect(linkData.url, { status: 302 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}