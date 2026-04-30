import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { prisma } from '@/lib/db'
import { generateSlug, isValidUrl, hashUrl } from '@/lib/utils'
import { Ratelimit } from '@upstash/ratelimit'
import { auth } from '@/auth'

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
})

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'anonymous'
    const { success } = await ratelimit.limit(ip)
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const body = await req.json()
    const { url, customAlias, expiresIn, burnAfterRead } = body

    if (!url || !isValidUrl(url)) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    const session = await auth()

    // Smart deduplication
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

    const slug = customAlias || generateSlug()

    if (customAlias) {
      const existing = await redis.get(`url:${slug}`)
      if (existing) {
        return NextResponse.json({ error: 'Alias already taken' }, { status: 409 })
      }
    }

    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000)
      : null

    const linkData = {
      url,
      createdAt: Date.now(),
      clicks: 0,
      burnAfterRead: burnAfterRead || false,
    }

    // Save to Redis
    if (expiresIn) {
      await redis.set(`url:${slug}`, JSON.stringify(linkData), { ex: expiresIn })
    } else {
      await redis.set(`url:${slug}`, JSON.stringify(linkData))
    }

    // Save hash for deduplication
    if (!burnAfterRead) {
      const urlHash = hashUrl(url)
      if (expiresIn) {
        await redis.set(`hash:${urlHash}`, slug, { ex: expiresIn })
      } else {
        await redis.set(`hash:${urlHash}`, slug)
      }
    }

    // Save to PostgreSQL if logged in
    if (session?.user) {
      const userId = session.user.id || session.user.email || ''

      // Upsert user in PostgreSQL
      await prisma.user.upsert({
        where: { githubId: userId },
        update: {
          name: session.user.name || '',
          avatar: session.user.image || '',
          email: session.user.email || '',
        },
        create: {
          githubId: userId,
          name: session.user.name || '',
          avatar: session.user.image || '',
          email: session.user.email || '',
        },
      })

      const user = await prisma.user.findUnique({
        where: { githubId: userId },
      })

      if (user) {
        // Save link to PostgreSQL
        await prisma.link.create({
          data: {
            slug,
            originalUrl: url,
            userId: user.id,
            burnAfterRead: burnAfterRead || false,
            expiresAt,
          },
        })
      }

      // Save to Redis user set
      await redis.sadd(`user:${userId}:links`, slug)
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