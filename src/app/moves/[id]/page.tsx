import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getMove(id: string) {
  const move = await prisma.move.findUnique({
    where: { id },
    include: {
      danceStyle: true,
      videos: true,
      relatedFrom: {
        include: {
          toMove: true,
        },
      },
      relatedTo: {
        include: {
          fromMove: true,
        },
      },
    },
  })
  return move
}

function extractYouTubeId(url: string): string | null {
  // Handle various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/results\?search_query=(.+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

function isYouTubeSearchUrl(url: string): boolean {
  return url.includes('youtube.com/results?search_query=')
}

const tierLabels: Record<number, { label: string; color: string }> = {
  1: { label: 'Fundamentals', color: 'bg-green-100 text-green-800' },
  2: { label: 'Intermediate', color: 'bg-blue-100 text-blue-800' },
  3: { label: 'Advanced', color: 'bg-purple-100 text-purple-800' },
  4: { label: 'Expert', color: 'bg-red-100 text-red-800' },
}

export default async function MovePage({ params }: PageProps) {
  const { id } = await params
  const move = await getMove(id)

  if (!move) {
    notFound()
  }

  const tier = tierLabels[move.tier] || tierLabels[1]

  // Collect all related moves
  const relatedMoves = [
    ...move.relatedFrom.map((r) => ({ ...r.toMove, relationType: r.relationType })),
    ...move.relatedTo.map((r) => ({ ...r.fromMove, relationType: r.relationType })),
  ]

  return (
    <AppShell title={move.name}>
      <div className="space-y-6">
        {/* Header with tier badge */}
        <div className="flex items-start justify-between">
          <div>
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${tier.color}`}>
              Level {move.tier} · {tier.label}
            </span>
            <p className="text-sm text-gray-500 mt-1">{move.danceStyle.name}</p>
          </div>
        </div>

        {/* Description */}
        {move.description && (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Description
            </h2>
            <p className="text-gray-700">{move.description}</p>
          </div>
        )}

        {/* Quick Search Button - Default YouTube Search */}
        {move.videos.some(v => v.description === 'Default YouTube search') && (
          <div>
            {move.videos
              .filter(v => v.description === 'Default YouTube search')
              .map((video) => (
                <a
                  key={video.id}
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 p-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                  </svg>
                  <span className="font-medium">Search YouTube for &quot;{move.name}&quot;</span>
                </a>
              ))}
          </div>
        )}

        {/* Other Videos (not the default search) */}
        {move.videos.filter(v => v.description !== 'Default YouTube search').length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Saved Videos
            </h2>
            <div className="space-y-4">
              {move.videos
                .filter(v => v.description !== 'Default YouTube search')
                .map((video) => {
                const isSearch = isYouTubeSearchUrl(video.url)
                const videoId = !isSearch ? extractYouTubeId(video.url) : null

                return (
                  <div key={video.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    {videoId && !isSearch ? (
                      // Embedded YouTube player
                      <div className="aspect-video">
                        <iframe
                          src={`https://www.youtube.com/embed/${videoId}`}
                          title={video.title || move.name}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full"
                        />
                      </div>
                    ) : (
                      // YouTube search link
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">
                            {video.title || 'Search on YouTube'}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            Tap to view
                          </p>
                        </div>
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                    {video.description && video.description !== 'Default YouTube search' && video.description !== 'Custom video' && (
                      <div className="px-4 py-3 border-t border-gray-100">
                        <p className="text-sm text-gray-600">{video.description}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Personal Notes */}
        {move.notes && (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Your Notes
            </h2>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-gray-700 whitespace-pre-wrap">{move.notes}</p>
            </div>
          </div>
        )}

        {/* Related Moves */}
        {relatedMoves.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Related Moves
            </h2>
            <div className="space-y-2">
              {relatedMoves.map((related) => (
                <Link
                  key={related.id}
                  href={`/moves/${related.id}`}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-indigo-200 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{related.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{related.relationType}</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* No video message */}
        {move.videos.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No videos attached to this move yet.</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Link
            href="/moves"
            className="flex-1 bg-gray-100 text-gray-700 rounded-lg py-3 px-4 font-medium text-center hover:bg-gray-200 transition-colors"
          >
            Back to Moves
          </Link>
          <Link
            href={`/moves/${move.id}/edit`}
            className="flex-1 bg-indigo-600 text-white rounded-lg py-3 px-4 font-medium text-center hover:bg-indigo-700 transition-colors"
          >
            Edit Move
          </Link>
        </div>
      </div>
    </AppShell>
  )
}
