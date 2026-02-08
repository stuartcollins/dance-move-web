import { AppShell } from '@/components/AppShell'

export default function ProfilePage() {
  return (
    <AppShell title="Profile">
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Demo User</h2>
          <p className="text-gray-500">demo@dancejournal.app</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 divide-y divide-gray-100">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Dance Style</h3>
            <p className="text-gray-900">West Coast Swing</p>
          </div>
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Profile Visibility</h3>
            <p className="text-gray-900">Private</p>
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4 text-sm text-yellow-800">
          <p className="font-medium mb-1">Authentication Coming Soon</p>
          <p>Sign in with email/password or Google to save your dance journal across devices.</p>
        </div>
      </div>
    </AppShell>
  )
}
