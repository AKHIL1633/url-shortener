import { redirect } from 'next/navigation'
import { redis } from '@/lib/redis'
import { prisma } from '@/lib/db'
import { headers } from 'next/headers'

interface LinkData {
  url: string
  createdAt: number
  clicks: number
  burnAfterRead: boolean
}

export default async function SlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const raw = await redis.get<string>(`url:${slug}`)

  if (!raw) redirect('/')

  const linkData: LinkData = typeof raw === 'string' ? JSON.parse(raw) : raw

  const headersList = await headers()
  const country = headersList.get('x-vercel-ip-country') ?? 'Unknown'
  const city = headersList.get('x-vercel-ip-city') ?? 'Unknown'

  if (linkData.burnAfterRead) {
    await redis.del(`url:${slug}`)
  } else {
    linkData.clicks += 1

    await Promise.all([
      redis.set(`url:${slug}`, JSON.stringify(linkData)),
      redis.lpush(`analytics:${slug}`, JSON.stringify({
        timestamp: Date.now(),
        country,
        city,
      })),
      redis.ltrim(`analytics:${slug}`, 0, 99),
    ])

    // Save click to PostgreSQL
    try {
      const link = await prisma.link.findUnique({ where: { slug } })
      if (link) {
        await Promise.all([
          prisma.click.create({
            data: {
              linkId: link.id,
              country,
              city,
            },
          }),
          prisma.link.update({
            where: { slug },
            data: { clicks: { increment: 1 } },
          }),
        ])
      }
    } catch (e) {
      console.error('PG click error:', e)
    }
  }

  redirect(linkData.url)
}