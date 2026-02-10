import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'
import { loadStyleData } from '@/lib/dance-style'

export async function POST(request: NextRequest) {
  try {
    const style = request.nextUrl.searchParams.get('style') || 'lindy-hop'
    const styleData = loadStyleData(style)

    const prisma = await getPrisma()

    // Get or create the dance style
    let danceStyle = await prisma.danceStyle.findUnique({
      where: { name: styleData.style.name }
    })

    if (!danceStyle) {
      danceStyle = await prisma.danceStyle.create({
        data: {
          name: styleData.style.name,
          description: styleData.style.description,
        }
      })
    }

    // Clear existing moves for this style to reseed
    await prisma.universalMoveRelation.deleteMany({
      where: {
        fromMove: { danceStyleId: danceStyle.id }
      }
    })
    await prisma.universalMove.deleteMany({
      where: { danceStyleId: danceStyle.id }
    })

    // Create all moves
    const moveMap = new Map<string, string>()

    for (const move of styleData.moves) {
      try {
        const created = await prisma.universalMove.create({
          data: {
            name: move.name,
            description: move.description,
            tier: move.tier,
            category: move.category,
            family: move.classifications.family,
            movementFamily: move.classifications.movementFamily,
            positionFrame: move.classifications.positionFrame,
            aliases: move.aliases?.join(', ') || null,
            danceStyleId: danceStyle.id,
          }
        })
        moveMap.set(move.name.toLowerCase(), created.id)
      } catch (err) {
        console.log(`Skipping duplicate move: ${move.name}`, err)
      }
    }

    // Create relationships
    let relationCount = 0
    for (const move of styleData.moves) {
      const fromId = moveMap.get(move.name.toLowerCase())
      if (!fromId || !move.relationships) continue

      for (const rel of move.relationships) {
        const toId = moveMap.get(rel.name.toLowerCase())
        if (!toId || fromId === toId) continue

        try {
          await prisma.universalMoveRelation.create({
            data: {
              fromMoveId: fromId,
              toMoveId: toId,
              weight: rel.weight,
              relationType: rel.type,
            }
          })
          relationCount++
        } catch {
          // Skip duplicates
        }
      }
    }

    return NextResponse.json({
      success: true,
      danceStyle: danceStyle.name,
      moveCount: moveMap.size,
      relationCount,
    })
  } catch (error) {
    console.error('Error seeding graph:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to seed graph data: ${message}` },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const style = request.nextUrl.searchParams.get('style') || 'lindy-hop'

    // Load scheme config from JSON
    let styleData
    try {
      styleData = loadStyleData(style)
    } catch {
      return NextResponse.json({ error: `Style '${style}' not found` }, { status: 404 })
    }

    const prisma = await getPrisma()
    const danceStyle = await prisma.danceStyle.findUnique({
      where: { name: styleData.style.name }
    })

    if (!danceStyle) {
      return NextResponse.json({
        style: styleData.style,
        schemes: styleData.schemes,
        moves: [],
      })
    }

    const moves = await prisma.universalMove.findMany({
      where: { danceStyleId: danceStyle.id },
      include: {
        danceStyle: true,
        relatedFrom: {
          include: { toMove: true }
        },
        relatedTo: {
          include: { fromMove: true }
        },
      },
      orderBy: { tier: 'asc' }
    })

    return NextResponse.json({
      style: styleData.style,
      schemes: styleData.schemes,
      moves,
    })
  } catch (error) {
    console.error('Error fetching graph:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to fetch graph data: ${message}` },
      { status: 500 }
    )
  }
}
