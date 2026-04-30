import { redirect } from 'next/navigation'
import { redis } from '@/lib/redis'

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

  if (linkData.burnAfterRead) {
    await redis.del(`url:${slug}`)
  } else {
    linkData.clicks += 1
    await Promise.all([
      redis.set(`url:${slug}`, JSON.stringify(linkData)),
      redis.lpush(`analytics:${slug}`, JSON.stringify({
        timestamp: Date.now(),
        country: 'Unknown',
        city: 'Unknown',
      })),
      redis.ltrim(`analytics:${slug}`, 0, 99),
    ])
  }

  redirect(linkData.url)
}