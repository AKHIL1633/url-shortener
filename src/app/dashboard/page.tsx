import { auth, signOut } from '@/auth'
import { redirect } from 'next/navigation'
import { redis } from '@/lib/redis'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">⚡ SnapLink</h1>
            <p className="text-purple-300">Welcome, {session.user.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <img
              src={session.user.image || ''}
              alt="avatar"
              className="w-10 h-10 rounded-full border-2 border-purple-500"
            />
            <form action={async () => {
              'use server'
              await signOut({ redirectTo: '/' })
            }}>
              <button
                type="submit"
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-colors text-sm"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>

        <DashboardClient userId={session.user.id || session.user.email || ''} />
      </div>
    </main>
  )
}