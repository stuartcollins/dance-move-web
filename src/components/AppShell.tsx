import { BottomNav } from './BottomNav'

interface AppShellProps {
  children: React.ReactNode
  title?: string
}

export function AppShell({ children, title }: AppShellProps) {
  return (
    <div className="min-h-screen pb-20">
      {title && (
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="max-w-lg mx-auto px-4 py-4">
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          </div>
        </header>
      )}
      <main className="max-w-lg mx-auto px-4 py-4">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
