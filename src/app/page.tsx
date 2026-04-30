'use client'

import { useState } from 'react'

export default function Home() {
  const [url, setUrl] = useState('')
  const [customAlias, setCustomAlias] = useState('')
  const [expiresIn, setExpiresIn] = useState('')
  const [burnAfterRead, setBurnAfterRead] = useState(false)
  const [result, setResult] = useState<{ shortUrl: string; slug: string; deduplicated: boolean } | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [analytics, setAnalytics] = useState<any>(null)

  const handleShorten = async () => {
    setLoading(true)
    setError('')
    setResult(null)
    setQrCode(null)
    setAnalytics(null)

    try {
      const res = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          customAlias: customAlias || undefined,
          expiresIn: expiresIn ? parseInt(expiresIn) : undefined,
          burnAfterRead,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setResult(data)

      // Generate QR code
      const qrRes = await fetch(`/api/qr?url=${encodeURIComponent(data.shortUrl)}`)
      const qrData = await qrRes.json()
      setQrCode(qrData.qr)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAnalytics = async () => {
    if (!result) return
    try {
      const res = await fetch(`/api/analytics/${result.slug}`)
      const data = await res.json()
      setAnalytics(data)
    } catch {
      setError('Failed to load analytics')
    }
  }

  const copyToClipboard = () => {
    if (result) navigator.clipboard.writeText(result.shortUrl)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">⚡ SnapLink</h1>
          <p className="text-purple-300">High-performance URL shortener with analytics</p>
        </div>

        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/20">
          {/* URL Input */}
          <div className="mb-4">
            <label className="text-white text-sm font-medium mb-1 block">Long URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/very-long-url..."
              className="w-full bg-white/10 text-white placeholder-white/40 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Custom Alias */}
          <div className="mb-4">
            <label className="text-white text-sm font-medium mb-1 block">Custom Alias (optional)</label>
            <div className="flex items-center bg-white/10 border border-white/20 rounded-xl px-4 py-3">
              <span className="text-purple-300 text-sm mr-1">localhost:3000/</span>
              <input
                type="text"
                value={customAlias}
                onChange={(e) => setCustomAlias(e.target.value)}
                placeholder="my-link"
                className="flex-1 bg-transparent text-white placeholder-white/40 focus:outline-none"
              />
            </div>
          </div>

          {/* Expiration */}
          <div className="mb-4">
            <label className="text-white text-sm font-medium mb-1 block">Expires In (seconds, optional)</label>
            <input
              type="number"
              value={expiresIn}
              onChange={(e) => setExpiresIn(e.target.value)}
              placeholder="e.g. 86400 = 24 hours"
              className="w-full bg-white/10 text-white placeholder-white/40 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Burn After Read */}
          <div className="mb-6 flex items-center gap-3">
            <input
              type="checkbox"
              id="burn"
              checked={burnAfterRead}
              onChange={(e) => setBurnAfterRead(e.target.checked)}
              className="w-4 h-4 accent-purple-500"
            />
            <label htmlFor="burn" className="text-white text-sm">
              🔥 Burn after read (link deletes itself after first click)
            </label>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 bg-red-500/20 border border-red-500/40 text-red-300 rounded-xl px-4 py-3 text-sm">
              ❌ {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleShorten}
            disabled={loading || !url}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200 text-lg"
          >
            {loading ? '⏳ Shortening...' : '⚡ Shorten URL'}
          </button>
        </div>

        {/* Result Card */}
        {result && (
          <div className="mt-4 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold text-lg">✅ Link Created!</h2>
              {result.deduplicated && (
                <span className="text-xs bg-blue-500/30 text-blue-300 px-2 py-1 rounded-full">♻️ Deduplicated</span>
              )}
            </div>

            <div className="flex items-center gap-2 mb-4">
              <a
                href={result.shortUrl}
                target="_blank"
                className="flex-1 bg-white/10 text-purple-300 px-4 py-2 rounded-xl truncate hover:text-white transition-colors"
              >
                {result.shortUrl}
              </a>
              <button
                onClick={copyToClipboard}
                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl transition-colors"
              >
                📋 Copy
              </button>
            </div>

            <div className="flex gap-2">
              {qrCode && (
                <div className="bg-white p-2 rounded-xl">
                  <img src={qrCode} alt="QR Code" className="w-24 h-24" />
                </div>
              )}
              <button
                onClick={handleAnalytics}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-xl transition-colors text-sm"
              >
                📊 View Analytics
              </button>
            </div>
          </div>
        )}

        {/* Analytics Card */}
        {analytics && (
          <div className="mt-4 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h2 className="text-white font-semibold text-lg mb-4">📊 Analytics</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <div className="text-3xl font-bold text-purple-300">{analytics.totalClicks}</div>
                <div className="text-white/60 text-sm">Total Clicks</div>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <div className="text-3xl font-bold text-purple-300">
                  {Object.keys(analytics.byCountry).length}
                </div>
                <div className="text-white/60 text-sm">Countries</div>
              </div>
            </div>

            {Object.keys(analytics.byCountry).length > 0 && (
              <div>
                <h3 className="text-white/60 text-sm mb-2">Clicks by Country</h3>
                {Object.entries(analytics.byCountry).map(([country, count]) => (
                  <div key={country} className="flex justify-between text-sm text-white py-1 border-b border-white/10">
                    <span>🌍 {country}</span>
                    <span className="text-purple-300">{count as number} clicks</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}