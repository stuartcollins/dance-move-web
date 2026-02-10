import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'

// Temporary: Get or create a demo user until auth is set up
async function getDemoUser() {
  const prisma = await getPrisma()
  let user = await prisma.user.findUnique({
    where: { email: 'demo@dancejournal.app' }
  })

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'demo@dancejournal.app',
        name: 'Demo User',
      }
    })
  }

  return user
}

// Get or create West Coast Swing dance style
async function getDefaultDanceStyle() {
  const prisma = await getPrisma()
  let style = await prisma.danceStyle.findUnique({
    where: { name: 'West Coast Swing' }
  })

  if (!style) {
    style = await prisma.danceStyle.create({
      data: {
        name: 'West Coast Swing',
        description: 'A smooth, slotted partner dance originating from Lindy Hop',
      }
    })
  }

  return style
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, tier, notes, videoUrl } = body

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Move name is required' },
        { status: 400 }
      )
    }

    const user = await getDemoUser()
    const danceStyle = await getDefaultDanceStyle()

    // Build the default YouTube search URL
    const defaultSearchQuery = `west coast swing ${name.trim()} tutorial`
    const defaultSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(defaultSearchQuery)}`

    // Prepare videos to create
    const videosToCreate = [
      {
        url: defaultSearchUrl,
        title: `Search: ${name.trim()}`,
        description: 'Default YouTube search',
      },
    ]

    // Add custom video if provided and different from default
    if (videoUrl && videoUrl !== defaultSearchUrl) {
      videosToCreate.push({
        url: videoUrl,
        title: `Video for ${name.trim()}`,
        description: 'Custom video',
      })
    }

    const prisma = await getPrisma()
    const move = await prisma.move.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        tier: tier || 1,
        notes: notes?.trim() || null,
        userId: user.id,
        danceStyleId: danceStyle.id,
        videos: {
          create: videosToCreate,
        },
      },
      include: {
        danceStyle: true,
        videos: true,
      }
    })

    return NextResponse.json(move, { status: 201 })
  } catch (error) {
    console.error('Error creating move:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to create move: ${message}` },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const prisma = await getPrisma()
    const moves = await prisma.move.findMany({
      include: {
        danceStyle: true,
        videos: true,
      },
      orderBy: [
        { tier: 'asc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json(moves)
  } catch (error) {
    console.error('Error fetching moves:', error)
    return NextResponse.json(
      { error: 'Failed to fetch moves' },
      { status: 500 }
    )
  }
}
