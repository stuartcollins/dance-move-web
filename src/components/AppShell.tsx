import { BottomNav } from './BottomNav'

interface AppShellProps {
  children: React.ReactNode
  title?: string
  fullWidth?: boolean
}

export function AppShell({ children, title, fullWidth = false }: AppShellProps) {
  const containerClass = fullWidth
    ? "max-w-7xl mx-auto px-4"
    : "max-w-lg mx-auto px-4"

  return (
    <div className="min-h-screen pb-20">
      {title && (
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className={`${containerClass} py-4`}>
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          </div>
        </header>
      )}
      <main className={`${containerClass} py-4`}>
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
