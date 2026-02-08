import Link from 'next/link'
import { AppShell } from '@/components/AppShell'

export default function Home() {
  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Dance Journal
        </h1>
        <p className="text-gray-600 mb-8 max-w-sm">
          Track your partner dance moves and learning journey. Build your personal catalog of moves you&apos;ve learned.
        </p>

        <div className="w-full space-y-4">
          <Link
            href="/moves"
            className="block w-full bg-indigo-600 text-white rounded-lg py-3 px-4 font-medium hover:bg-indigo-700 transition-colors"
          >
            View My Moves
          </Link>
          <Link
            href="/moves/new"
            className="block w-full bg-white text-indigo-600 border border-indigo-600 rounded-lg py-3 px-4 font-medium hover:bg-indigo-50 transition-colors"
          >
            Add New Move
          </Link>
        </div>

        <div className="mt-12 text-left w-full">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <p className="text-2xl font-bold text-indigo-600">0</p>
              <p className="text-sm text-gray-500">Moves Tracked</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <p className="text-2xl font-bold text-indigo-600">0</p>
              <p className="text-sm text-gray-500">Videos Saved</p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
