'use client'

import { useState, useEffect } from 'react'
import AnalyticsChart from './AnalyticsChart'

interface LinkData {
  slug: string
  url: string
  clicks: number
  createdAt: number
  burnAfterRead: boolean
}

interface AnalyticsData {
  totalClicks: number
  recentClicks: { timestamp: number; country: string; city: string }[]
  byCountry: Record<string, number>
}

export default function DashboardClient({ userId }: { userId: string }) {
  const [links, setLinks] = useState<LinkData[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  useEffect(() => {
    fetchLinks()
  }, [])

  const fetchLinks = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/links')
      const data = await res.json()
      setLinks(data.links || [])
    } catch {
      console.error('Failed to fetch links')
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async (slug: string) => {
    if (selectedSlug === slug) {
      setSelectedSlug(null)
      setAnalytics(null)
      return
    }
    setSelectedSlug(slug)
    setAnalyticsLoading(true)
    try {
      const res = await fetch(`/api/analytics/${slug}`)
      const data = await res.json()
      setAnalytics(data)
    } catch {
      console.error('Failed to fetch analytics')
    } finally {
      setAnalyticsLoading(false)
    }
  }

  const deleteLink = async (slug: string) => {
    try {
      await fetch(`/api/links/${slug}`, { method: 'DELETE' })
      setLinks(links.filter(l => l.slug !== slug))
      if (selectedSlug === slug) {
        setSelectedSlug(null)
        setAnalytics(null)
      }
    } catch {
      console.error('Failed to delete link')
    }
  }

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/${slug}`)
    setCopied(slug)
    setTimeout(() => setCopied(null), 2000)
  }

  const totalClicks = links.reduce((sum, l) => sum + l.clicks, 0)

  if (loading) {
    return (
      <div className="text-center text-white/60 py-20">
        <div className="animate-spin text-4xl mb-4">⚡</div>
        Loading your links...
      </div>
    )
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white/10 rounded-2xl p-4 text-center border border-white/20">
          <div className="text-3xl font-bold text-purple-300">{links.length}</div>
          <div className="text-white/60 text-sm">Total Links</div>
        </div>
        <div className="bg-white/10 rounded-2xl p-4 text-center border border-white/20">
          <div className="text-3xl font-bold text-purple-300">{totalClicks}</div>
          <div className="text-white/60 text-sm">Total Clicks</div>
        </div>
        <div className="bg-white/10 rounded-2xl p-4 text-center border border-white/20">
          <div className="text-3xl font-bold text-purple-300">
            {links.length > 0 ? Math.round(totalClicks / links.length) : 0}
          </div>
          <div className="text-white/60 text-sm">Avg Clicks</div>
        </div>
      </div>

      {/* Links Table */}
      <div className="bg-white/10 rounded-2xl border border-white/20 overflow-hidden mb-4">
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-white font-semibold">Your Links</h2>
          <a
            href="/"
            className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-sm transition-colors"
          >
            + Create New
          </a>
        </div>

        {links.length === 0 ? (
          <div className="text-center text-white/40 py-16">
            <div className="text-4xl mb-2">🔗</div>
            <p>No links yet. Create your first one!</p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {links.map((link) => (
              <div key={link.slug}>
                <div className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-purple-300 font-medium">/{link.slug}</span>
                      {link.burnAfterRead && (
                        <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full">🔥 Burn</span>
                      )}
                    </div>
                    <p className="text-white/40 text-sm truncate">{link.url}</p>
                  </div>

                  <div className="text-center">
                    <div className="text-white font-semibold">{link.clicks}</div>
                    <div className="text-white/40 text-xs">clicks</div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchAnalytics(link.slug)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        selectedSlug === link.slug
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      📊
                    </button>
                    <button
                      onClick={() => copyLink(link.slug)}
                      className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
                    >
                      {copied === link.slug ? '✅' : '📋'}
                    </button>
                    <button
                      onClick={() => deleteLink(link.slug)}
                      className="bg-red-500/20 hover:bg-red-500/40 text-red-300 px-3 py-1.5 rounded-lg text-sm transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Analytics Panel */}
                {selectedSlug === link.slug && (
                  <div className="px-4 pb-4 bg-white/5 border-t border-white/10">
                    <div className="pt-4">
                      {analyticsLoading ? (
                        <div className="text-center text-white/60 py-8">Loading analytics...</div>
                      ) : analytics ? (
                        <AnalyticsChart
                          clicks={analytics.recentClicks}
                          totalClicks={analytics.totalClicks}
                        />
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}