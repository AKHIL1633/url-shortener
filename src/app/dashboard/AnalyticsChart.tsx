'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

interface ClickData {
  timestamp: number
  country: string
  city: string
}

interface Props {
  clicks: ClickData[]
  totalClicks: number
}

export default function AnalyticsChart({ clicks, totalClicks }: Props) {
  // Group clicks by day
  const clicksByDay = clicks.reduce((acc: Record<string, number>, click) => {
    const date = new Date(click.timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {})

  const chartData = Object.entries(clicksByDay).map(([date, count]) => ({
    date,
    clicks: count,
  }))

  // Group by country
  const byCountry = clicks.reduce((acc: Record<string, number>, click) => {
    acc[click.country] = (acc[click.country] || 0) + 1
    return acc
  }, {})

  const countryData = Object.entries(byCountry)
    .map(([country, count]) => ({ country, clicks: count }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5)

  if (clicks.length === 0) {
    return (
      <div className="text-center text-white/40 py-8">
        <div className="text-3xl mb-2">📊</div>
        <p>No click data yet. Share your link to see analytics!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Clicks over time */}
      <div>
        <h3 className="text-white/60 text-sm mb-3">Clicks Over Time</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 12 }} />
            <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0,0,0,0.8)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: 'white',
              }}
            />
            <Line type="monotone" dataKey="clicks" stroke="#a855f7" strokeWidth={2} dot={{ fill: '#a855f7' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Clicks by country */}
      {countryData.length > 0 && (
        <div>
          <h3 className="text-white/60 text-sm mb-3">Clicks by Country</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={countryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="country" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 12 }} />
              <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: 'white',
                }}
              />
              <Bar dataKey="clicks" fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}