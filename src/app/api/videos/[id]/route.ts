import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const prisma = await getPrisma()
    const { id } = await params

    await prisma.video.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting video:', error)
    return NextResponse.json(
      { error: 'Failed to delete video' },
      { status: 500 }
    )
  }
}
