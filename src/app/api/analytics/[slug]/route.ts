import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const raw = await redis.get<string>(`url:${slug}`)
    if (!raw) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    }

    const linkData = typeof raw === 'string' ? JSON.parse(raw) : raw
    const analyticsRaw = await redis.lrange(`analytics:${slug}`, 0, 99)

    const clicks = analyticsRaw.map((entry) =>
      typeof entry === 'string' ? JSON.parse(entry) : entry
    )

    // Count by country
    const byCountry: Record<string, number> = {}
    clicks.forEach((click: { country: string; city: string; timestamp: number }) => {
      byCountry[click.country] = (byCountry[click.country] || 0) + 1
    })

    return NextResponse.json({
      slug,
      originalUrl: linkData.url,
      totalClicks: linkData.clicks,
      createdAt: linkData.createdAt,
      recentClicks: clicks.slice(0, 10),
      byCountry,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}