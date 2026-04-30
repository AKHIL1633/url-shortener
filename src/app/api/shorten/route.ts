import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { generateSlug, isValidUrl, hashUrl } from '@/lib/utils'
import { Ratelimit } from '@upstash/ratelimit'

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
})

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for') ?? 'anonymous'
    const { success } = await ratelimit.limit(ip)
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const body = await req.json()
    const { url, customAlias, expiresIn, burnAfterRead } = body

    // Validate URL
    if (!url || !isValidUrl(url)) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    // Smart deduplication — O(1) lookup
    if (!customAlias && !burnAfterRead) {
      const urlHash = hashUrl(url)
      const existingSlug = await redis.get<string>(`hash:${urlHash}`)
      if (existingSlug) {
        return NextResponse.json({
          shortUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/${existingSlug}`,
          slug: existingSlug,
          deduplicated: true,
        })
      }
    }

    // Use custom alias or generate one
    const slug = customAlias || generateSlug()

    // Check if custom alias already taken
    if (customAlias) {
      const existing = await redis.get(`url:${slug}`)
      if (existing) {
        return NextResponse.json({ error: 'Alias already taken' }, { status: 409 })
      }
    }

    // Build link data
    const linkData = {
      url,
      createdAt: Date.now(),
      clicks: 0,
      burnAfterRead: burnAfterRead || false,
    }

    // Store with optional expiration (TTL)
    if (expiresIn) {
      await redis.set(`url:${slug}`, JSON.stringify(linkData), { ex: expiresIn })
    } else {
      await redis.set(`url:${slug}`, JSON.stringify(linkData))
    }

    // Store hash for deduplication
    if (!burnAfterRead) {
      const urlHash = hashUrl(url)
      if (expiresIn) {
        await redis.set(`hash:${urlHash}`, slug, { ex: expiresIn })
      } else {
        await redis.set(`hash:${urlHash}`, slug)
      }
    }

    return NextResponse.json({
      shortUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/${slug}`,
      slug,
      deduplicated: false,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}