import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import * as fs from 'fs'
import * as path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')

// Style generation writes JSON to the local filesystem, which only works in dev.
// TODO: To enable in production, migrate to storing generated styles in Turso DB
// (add a json column to DanceStyle, update loadStyleData() to check DB first).
export async function POST(request: NextRequest) {
  try {
    // Block in production — serverless functions have ephemeral filesystems
    if (process.env.VERCEL) {
      return NextResponse.json(
        { error: 'Style generation is not yet available in production. Run locally with npm run dev.' },
        { status: 501 }
      )
    }

    const body = await request.json()
    const { styleName } = body

    if (!styleName || typeof styleName !== 'string') {
      return NextResponse.json({ error: 'styleName is required' }, { status: 400 })
    }

    const slug = styleName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const outPath = path.join(DATA_DIR, `${slug}.json`)

    // Check if already exists
    if (fs.existsSync(outPath)) {
      return NextResponse.json({ error: `Style '${slug}' already exists` }, { status: 409 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
    }

    const client = new Anthropic({ apiKey })

    const prompt = `Generate a comprehensive dance move dataset for "${styleName}" in JSON format.

The JSON must follow this exact schema:

{
  "style": {
    "name": "${styleName}",
    "slug": "${slug}",
    "description": "1-2 sentence description of the dance style"
  },
  "schemes": {
    "hybrid": {
      "label": "Hybrid",
      "description": "3-5 word description",
      "nodeKey": "family",
      "groups": {
        "group_key": {
          "position": 0.15,
          "color": { "base": "#hex", "light": "#hex" },
          "label": "Human Label"
        }
      }
    },
    "movement": {
      "label": "Movement Family",
      "description": "3-5 word description",
      "nodeKey": "movementFamily",
      "groups": { ... }
    },
    "position": {
      "label": "Position/Frame",
      "description": "3-5 word description",
      "nodeKey": "positionFrame",
      "groups": { ... }
    }
  },
  "moves": [
    {
      "name": "Move Name",
      "description": "1-2 sentence description",
      "tier": 1,
      "category": "solo" or "partnered",
      "aliases": ["Alt Name"],
      "classifications": {
        "family": "group_key from hybrid scheme",
        "movementFamily": "group_key from movement scheme",
        "positionFrame": "group_key from position scheme"
      },
      "relationships": [
        { "name": "Other Move Name", "weight": 0.8, "type": "prerequisite" }
      ]
    }
  ]
}

IMPORTANT CONSTRAINTS:
1. Include 80-150 moves total
2. Tier distribution: ~10% tier 1 (fundamentals), ~25% tier 2 (core), ~35% tier 3 (intermediate), ~30% tier 4 (advanced)
3. Each scheme must have 3-5 groups with positions evenly distributed between 0.1 and 0.9
4. The 3 scheme nodeKey values MUST be exactly "family", "movementFamily", "positionFrame"
5. Every move's classifications must reference valid group keys from the corresponding scheme
6. Relationship types: "prerequisite", "related", "variation", "leads_to"
7. Weights between 0.5 and 1.0
8. Aim for 150-300 total relationships (1-4 per move)
9. Relationship "name" must exactly match another move's "name" in the dataset
10. Colors should use distinct, visually appealing hex colors (base = saturated, light = pastel version)
11. Group keys must be snake_case
12. Categories should reflect whether the move is typically done solo or with a partner

Be accurate and comprehensive about real ${styleName} moves, technique, and terminology. Include foundational steps, core patterns, intermediate variations, and advanced techniques.

Return ONLY the JSON object, no markdown fences or explanation.`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 16000,
      messages: [{ role: 'user', content: prompt }],
    })

    // Extract text content
    const textBlock = message.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'No text response from Claude' }, { status: 500 })
    }

    // Parse and validate
    let styleData
    try {
      // Strip any markdown fences if present
      let jsonStr = textBlock.text.trim()
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
      }
      styleData = JSON.parse(jsonStr)
    } catch {
      return NextResponse.json({ error: 'Failed to parse Claude response as JSON' }, { status: 500 })
    }

    // Basic validation
    if (!styleData.style || !styleData.schemes || !styleData.moves) {
      return NextResponse.json({ error: 'Invalid style data structure' }, { status: 500 })
    }

    if (!Array.isArray(styleData.moves) || styleData.moves.length < 20) {
      return NextResponse.json({ error: `Too few moves generated: ${styleData.moves?.length || 0}` }, { status: 500 })
    }

    // Ensure slug/name are correct
    styleData.style.name = styleName
    styleData.style.slug = slug

    // Validate all move classification keys match scheme group keys
    const schemeKeys = {
      family: new Set(Object.keys(styleData.schemes.hybrid?.groups || {})),
      movementFamily: new Set(Object.keys(styleData.schemes.movement?.groups || {})),
      positionFrame: new Set(Object.keys(styleData.schemes.position?.groups || {})),
    }

    for (const move of styleData.moves) {
      if (move.classifications) {
        for (const [key, value] of Object.entries(move.classifications) as [string, string][]) {
          const validKeys = schemeKeys[key as keyof typeof schemeKeys]
          if (validKeys && !validKeys.has(value)) {
            // Auto-fix: assign to first valid group
            const firstKey = [...validKeys][0]
            if (firstKey) move.classifications[key] = firstKey
          }
        }
      }
    }

    // Write to data directory
    fs.mkdirSync(DATA_DIR, { recursive: true })
    fs.writeFileSync(outPath, JSON.stringify(styleData, null, 2))

    return NextResponse.json({
      success: true,
      slug,
      name: styleName,
      moveCount: styleData.moves.length,
      relationshipCount: styleData.moves.reduce(
        (sum: number, m: { relationships?: unknown[] }) => sum + (m.relationships?.length || 0), 0
      ),
    })
  } catch (error) {
    console.error('Error generating style:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to generate style: ${message}` },
      { status: 500 }
    )
  }
}
