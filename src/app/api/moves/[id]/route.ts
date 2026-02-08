import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params

    const move = await prisma.move.findUnique({
      where: { id },
      include: {
        danceStyle: true,
        videos: true,
      },
    })

    if (!move) {
      return NextResponse.json(
        { error: 'Move not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(move)
  } catch (error) {
    console.error('Error fetching move:', error)
    return NextResponse.json(
      { error: 'Failed to fetch move' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, tier, notes, newVideoUrl } = body

    // Update the move
    const move = await prisma.move.update({
      where: { id },
      data: {
        name: name?.trim(),
        description: description?.trim() || null,
        tier: tier || 1,
        notes: notes?.trim() || null,
      },
      include: {
        danceStyle: true,
        videos: true,
      },
    })

    // Add new video if provided
    if (newVideoUrl) {
      await prisma.video.create({
        data: {
          url: newVideoUrl,
          title: `Video for ${move.name}`,
          moveId: move.id,
        },
      })
    }

    return NextResponse.json(move)
  } catch (error) {
    console.error('Error updating move:', error)
    return NextResponse.json(
      { error: 'Failed to update move' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params

    await prisma.move.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting move:', error)
    return NextResponse.json(
      { error: 'Failed to delete move' },
      { status: 500 }
    )
  }
}
