import { NextResponse } from 'next/server'
import { listStyles } from '@/lib/dance-style'

export async function GET() {
  try {
    const styles = listStyles()
    return NextResponse.json(styles)
  } catch (error) {
    console.error('Error listing styles:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to list styles: ${message}` },
      { status: 500 }
    )
  }
}
