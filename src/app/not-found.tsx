import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-8xl font-bold text-purple-300 mb-4">404</div>
        <h1 className="text-3xl font-bold text-white mb-2">Link Not Found</h1>
        <p className="text-white/60 mb-8">This link may have expired or never existed.</p>
        <Link
          href="/"
          className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          ⚡ Create a New Link
        </Link>
      </div>
    </main>
  )
}