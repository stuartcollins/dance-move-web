import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Get all moves
    const moves = await prisma.move.findMany({
      include: {
        videos: true,
      },
    })

    let added = 0

    for (const move of moves) {
      // Check if move already has a default search video
      const hasDefaultSearch = move.videos.some(
        (v) => v.description === 'Default YouTube search'
      )

      if (!hasDefaultSearch) {
        const defaultSearchQuery = `west coast swing ${move.name} tutorial`
        const defaultSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(defaultSearchQuery)}`

        await prisma.video.create({
          data: {
            url: defaultSearchUrl,
            title: `Search: ${move.name}`,
            description: 'Default YouTube search',
            moveId: move.id,
          },
        })
        added++
      }
    }

    return NextResponse.json({
      success: true,
      movesProcessed: moves.length,
      videosAdded: added,
    })
  } catch (error) {
    console.error('Error backfilling videos:', error)
    return NextResponse.json(
      { error: 'Failed to backfill videos' },
      { status: 500 }
    )
  }
}
