import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

interface MoveLookupResult {
  name: string
  description: string
  tier: number
  relatedMoves: string[]
  suggestedVideos: { title: string; searchQuery: string }[]
}

// Mock data for testing without API key
const mockMoves: Record<string, MoveLookupResult> = {
  'sugar push': {
    name: 'Sugar Push',
    description: 'A fundamental 6-count pattern where the follower is led forward toward the leader, then redirected back to their original position. It\'s one of the first patterns learned in West Coast Swing and establishes the elastic connection between partners.',
    tier: 1,
    relatedMoves: ['Starter Step', 'Left Side Pass', 'Push Break'],
    suggestedVideos: [
      { title: 'WCS Sugar Push for Beginners', searchQuery: 'west coast swing sugar push beginner tutorial' },
      { title: 'Sugar Push Technique Tips', searchQuery: 'west coast swing sugar push technique' },
    ],
  },
  'whip': {
    name: 'Whip',
    description: 'An 8-count circular pattern that is a signature move of West Coast Swing. The follower travels in a rounded path while the leader redirects them, creating the characteristic "whip" action. It\'s essential for musicality and styling.',
    tier: 2,
    relatedMoves: ['Sugar Push', 'Left Side Pass', 'Inside Turn'],
    suggestedVideos: [
      { title: 'Basic Whip Pattern Breakdown', searchQuery: 'west coast swing whip basic tutorial' },
      { title: 'Whip Variations for Intermediate Dancers', searchQuery: 'west coast swing whip variations' },
    ],
  },
  'left side pass': {
    name: 'Left Side Pass',
    description: 'A 6-count pattern where the follower passes by the leader\'s left side, traveling down the slot. It\'s one of the core patterns that teaches slot movement and is used frequently in social dancing.',
    tier: 1,
    relatedMoves: ['Sugar Push', 'Right Side Pass', 'Underarm Turn'],
    suggestedVideos: [
      { title: 'Left Side Pass Fundamentals', searchQuery: 'west coast swing left side pass beginner' },
      { title: 'Styling Your Side Passes', searchQuery: 'west coast swing side pass styling' },
    ],
  },
  'starter step': {
    name: 'Starter Step',
    description: 'The basic walking pattern used to begin dancing West Coast Swing. Both partners walk toward each other and establish connection. It\'s typically the very first thing taught to new dancers.',
    tier: 1,
    relatedMoves: ['Sugar Push', 'Left Side Pass'],
    suggestedVideos: [
      { title: 'Your First WCS Steps', searchQuery: 'west coast swing starter step beginner' },
      { title: 'Building Connection from the Start', searchQuery: 'west coast swing connection basics' },
    ],
  },
  'tuck turn': {
    name: 'Tuck Turn',
    description: 'A turning pattern where the leader creates a "tuck" by bringing the follower\'s arm in before sending them into a spin. It adds flair and allows for musical interpretation while maintaining slot integrity.',
    tier: 2,
    relatedMoves: ['Whip', 'Inside Turn', 'Sugar Push'],
    suggestedVideos: [
      { title: 'Tuck Turn Basics', searchQuery: 'west coast swing tuck turn tutorial' },
      { title: 'Leading Clean Tuck Turns', searchQuery: 'west coast swing tuck turn lead technique' },
    ],
  },
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { moveName, danceStyle = 'West Coast Swing' } = body

    if (!moveName || typeof moveName !== 'string' || moveName.trim() === '') {
      return NextResponse.json(
        { error: 'Move name is required' },
        { status: 400 }
      )
    }

    const normalizedName = moveName.trim().toLowerCase()

    // Check for mock data first (useful for testing without API key)
    if (!process.env.ANTHROPIC_API_KEY) {
      const mockResult = mockMoves[normalizedName]
      if (mockResult) {
        return NextResponse.json(mockResult)
      }
      // If no mock data, return a generic response
      return NextResponse.json({
        name: moveName.trim(),
        description: `A ${danceStyle} move. (Mock mode - no API key configured. Try searching for: Sugar Push, Whip, Left Side Pass, Starter Step, or Tuck Turn)`,
        tier: 2,
        relatedMoves: [],
        suggestedVideos: [
          { title: `${moveName} Tutorial`, searchQuery: `west coast swing ${moveName} tutorial` }
        ],
      })
    }

    const anthropic = new Anthropic()

    const prompt = `You are a knowledgeable partner dance instructor specializing in ${danceStyle}.

A student wants to learn about a dance move called "${moveName.trim()}".

Please provide information about this move in the following JSON format:
{
  "name": "The correct/common name for this move",
  "description": "A clear, concise description of this move (2-3 sentences). Explain what it looks like and the basic mechanics.",
  "tier": <number 1-4 where 1=fundamental/beginner, 2=intermediate, 3=advanced, 4=expert>,
  "relatedMoves": ["list", "of", "related", "moves", "or", "prerequisites"],
  "suggestedVideos": [
    {"title": "Descriptive title for a tutorial video", "searchQuery": "YouTube search query to find this video"}
  ]
}

If you don't recognize this as a valid ${danceStyle} move, still try your best to provide information, but note any uncertainty in the description. If it could be a misspelling, suggest the correct name.

Respond with ONLY the JSON object, no other text.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        { role: 'user', content: prompt }
      ],
    })

    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : ''

    // Parse the JSON response
    let moveInfo: MoveLookupResult
    try {
      moveInfo = JSON.parse(responseText)
    } catch {
      // If JSON parsing fails, try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        moveInfo = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Failed to parse move information')
      }
    }

    return NextResponse.json(moveInfo)
  } catch (error) {
    console.error('Error looking up move:', error)

    if (error instanceof Anthropic.APIError) {
      if (error.status === 401) {
        return NextResponse.json(
          { error: 'API key not configured. Please set ANTHROPIC_API_KEY environment variable.' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to look up move information' },
      { status: 500 }
    )
  }
}
