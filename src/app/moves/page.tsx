import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function getMoves(danceStyleName: string) {
  const moves = await prisma.move.findMany({
    where: {
      danceStyle: {
        name: danceStyleName,
      },
    },
    include: {
      danceStyle: true,
      videos: true,
    },
    orderBy: [
      { tier: 'asc' },
      { name: 'asc' },
    ],
  })
  return moves
}

async function getDanceStyles() {
  return prisma.danceStyle.findMany({
    orderBy: { name: 'asc' },
  })
}

export default async function MovesPage() {
  // For now, default to West Coast Swing
  // Later this could come from user preferences or URL params
  const currentStyle = 'West Coast Swing'

  const [moves, danceStyles] = await Promise.all([
    getMoves(currentStyle),
    getDanceStyles(),
  ])

  const tierLabels: Record<number, string> = {
    1: 'Fundamentals',
    2: 'Intermediate',
    3: 'Advanced',
    4: 'Expert',
  }

  const groupedMoves = moves.reduce((acc, move) => {
    const tier = move.tier
    if (!acc[tier]) acc[tier] = []
    acc[tier].push(move)
    return acc
  }, {} as Record<number, typeof moves>)

  return (
    <AppShell title="My Moves">
      <div className="space-y-6">
        {/* Dance Style Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{currentStyle}</h2>
            <p className="text-sm text-gray-500">
              {moves.length} {moves.length === 1 ? 'move' : 'moves'} tracked
            </p>
          </div>
          <Link
            href="/moves/new"
            className="bg-indigo-600 text-white rounded-lg py-2 px-4 text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            + Add Move
          </Link>
        </div>

        {/* Dance Style Switcher (for future use) */}
        {danceStyles.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {danceStyles.map((style) => (
              <button
                key={style.id}
                className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                  style.name === currentStyle
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {style.name}
              </button>
            ))}
          </div>
        )}

        {moves.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No moves tracked yet</p>
            <Link
              href="/moves/new"
              className="text-indigo-600 font-medium hover:text-indigo-700"
            >
              Add your first move
            </Link>
          </div>
        ) : (
          Object.entries(groupedMoves)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([tier, tierMoves]) => (
              <div key={tier}>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  {tierLabels[Number(tier)] || `Tier ${tier}`}
                </h3>
                <div className="space-y-2">
                  {tierMoves.map((move) => (
                    <Link
                      key={move.id}
                      href={`/moves/${move.id}`}
                      className="block bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:border-indigo-200 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-gray-900">{move.name}</h4>
                        {move.videos.length > 0 && (
                          <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-1">
                            {move.videos.length} video{move.videos.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      {move.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {move.description}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))
        )}
      </div>
    </AppShell>
  )
}
