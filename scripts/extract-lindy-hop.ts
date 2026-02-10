#!/usr/bin/env npx tsx
/**
 * One-off extraction script: reads the existing seed route's move data and
 * classification functions, runs them, and outputs data/lindy-hop.json
 * in the new multi-style JSON format.
 *
 * Usage: npx tsx scripts/extract-lindy-hop.ts
 */

import * as fs from 'fs'
import * as path from 'path'

// ─── Classification functions (copied from seed/route.ts) ───

type MoveFamily = 'core_lindy' | 'charleston' | 'jazz_styling' | 'aerials_specials'

function getMoveFamily(name: string, category: string): MoveFamily {
  const nameLower = name.toLowerCase()
  if (nameLower.includes('aerial') || nameLower.includes('air step') ||
      nameLower.includes('dip') || nameLower.includes('drop') ||
      nameLower.includes('kip') || nameLower.includes('side car') ||
      nameLower.includes('frankie throw') || nameLower.includes('lift')) {
    return 'aerials_specials'
  }
  if (nameLower.includes('charleston') || nameLower.includes('tandem') ||
      nameLower.includes('side-by-side') || nameLower.includes('hand-to-hand')) {
    return 'charleston'
  }
  const jazzMoves = [
    'suzie q', 'truckin', 'shorty george', 'boogie', 'tacky annie',
    'shim sham', 'big apple', 'tranky doo', 'jitterbug stroll', 'first stops',
    'fall off the log', 'apple jacks', 'knee slaps', 'crazy legs', 'rubber legs',
    'break-a-leg', 'fishtail', 'rusty dusty', 'peckin', 'spank the baby',
    'gaze afar', 'freeze', 'snake hips', 'mess around', 'itch', 'scratch',
    'shout', 'praise allah', 'lock turn', 'flying home', 'grinds',
    'crossovers', 'johnny\'s drop', 'heel rock', 'ba dum', 'jazz walk',
    'strut', 'camel walk', 'pimp walk', 'savoy kicks', 'eagle slide',
    'scarecrow', 'tick tock', 'skip up', 'bells', 'scissors'
  ]
  if (jazzMoves.some(jazz => nameLower.includes(jazz)) ||
      (category === 'solo' && !nameLower.includes('charleston'))) {
    return 'jazz_styling'
  }
  return 'core_lindy'
}

type MovementFamily = 'swingout' | 'charleston' | 'turns' | 'jazz_styling' | 'fundamentals'

function getMovementFamily(name: string, category: string): MovementFamily {
  const n = name.toLowerCase()
  if (['rock step', 'triple step', 'pulse', 'connection', 'frame',
       'closed position', 'open position', '6-count basic', '8-count basic',
       'bounce', 'kick ball change'].some(f => n === f)) {
    return 'fundamentals'
  }
  if (n.includes('swingout') || n.includes('swing out') || n.includes('lindy circle') ||
      n.includes('send out') || n.includes('bring in') || n.includes('pass by') ||
      n.includes('tuck turn') || n.includes('underarm turn') || n.includes('sugar push') ||
      n.includes('basket whip') || n.includes('cuddle') || n.includes('promenade') ||
      n.includes('pecks') || n.includes('frankie 6') || n.includes('hammerlock') ||
      n.includes('texas tommy') || n.includes('sliding door') || n.includes('revolving door') ||
      n.includes('trebuchet') || n.includes('cross-body') || n.includes('toss across') ||
      n.includes('liquid') || n.includes('lift and slide') || n.includes('cross and lunge') ||
      n.includes('foot sweep') || n.includes('kick away') || n.includes('stop on 5') ||
      n.includes('swingout kate') || n.includes('california routine') ||
      n === 'savoy swingout' || n === 'hollywood swingout') {
    return 'swingout'
  }
  if (n.includes('charleston') || n.includes('tandem') || n.includes('side-by-side') ||
      n.includes('hand-to-hand') || n.includes('jockey') || n.includes('skip up') ||
      n.includes('flip flop') || n.includes('airplane')) {
    return 'charleston'
  }
  if (n.includes('turn') || n.includes('spin') || n.includes('loop') ||
      n.includes('free spin') || n.includes('swivel') || n.includes('switch')) {
    return 'turns'
  }
  if (category === 'solo') {
    return 'jazz_styling'
  }
  if (n.includes('aerial') || n.includes('dip') || n.includes('drop') ||
      n.includes('kip') || n.includes('side car') || n.includes('frankie throw')) {
    return 'swingout'
  }
  return 'swingout'
}

type PositionFrame = 'closed' | 'open' | 'tandem' | 'side_by_side' | 'solo'

function getPositionFrame(name: string, category: string): PositionFrame {
  const n = name.toLowerCase()
  if (category === 'solo') return 'solo'
  if (n.includes('tandem') || n.includes('airplane') || n.includes('shadow') ||
      n.includes('cuddle') || n.includes('promenade')) return 'tandem'
  if (n.includes('side-by-side') || n.includes('hand-to-hand') ||
      n.includes('jockey')) return 'side_by_side'
  if (n.includes('closed') || n.includes('lindy circle') ||
      n.includes('swingout from closed') || n === 'frame' ||
      n === 'connection' || n === 'pulse' ||
      n.includes('basket whip') || n.includes('pecks') ||
      n.includes('liquid') || n.includes('stop on 5')) return 'closed'
  return 'open'
}

// ─── Read the move data from the seed route ───

const seedPath = path.join(__dirname, '../src/app/api/graph/seed/route.ts')
const seedContent = fs.readFileSync(seedPath, 'utf-8')

// Extract the lindyHopMoveData array using regex
const arrayMatch = seedContent.match(/const lindyHopMoveData: MoveData\[\] = \[([\s\S]*?)\n\]/)
if (!arrayMatch) {
  console.error('Could not find lindyHopMoveData array in seed route')
  process.exit(1)
}

// Parse the array - we need to evaluate it as JS
// Clean up TypeScript-specific syntax and evaluate
const arrayStr = '[' + arrayMatch[1] + '\n]'
// The array uses simple object literal syntax, safe to eval
const moveData: Array<{
  name: string
  description: string
  tier: number
  category: 'solo' | 'partnered'
  aliases?: string[]
  relatedMoves: { name: string; weight: number; type: string }[]
}> = eval(arrayStr)

console.log(`Extracted ${moveData.length} moves from seed route`)

// ─── Build the JSON structure ───

interface StyleMove {
  name: string
  description: string
  tier: number
  category: string
  aliases?: string[]
  classifications: {
    family: string
    movementFamily: string
    positionFrame: string
  }
  relationships: { name: string; weight: number; type: string }[]
}

const moves: StyleMove[] = moveData.map(m => ({
  name: m.name,
  description: m.description,
  tier: m.tier,
  category: m.category,
  ...(m.aliases && m.aliases.length > 0 ? { aliases: m.aliases } : {}),
  classifications: {
    family: getMoveFamily(m.name, m.category),
    movementFamily: getMovementFamily(m.name, m.category),
    positionFrame: getPositionFrame(m.name, m.category),
  },
  relationships: m.relatedMoves || [],
}))

// Count relationships
let totalRelationships = 0
for (const m of moves) {
  totalRelationships += m.relationships.length
}

const styleData = {
  style: {
    name: 'Lindy Hop',
    slug: 'lindy-hop',
    description: 'The original swing dance, born in Harlem in the late 1920s. Characterized by its swingout, improvisation, and connection to jazz music.',
  },
  schemes: {
    hybrid: {
      label: 'Hybrid',
      description: '4 practical groups',
      nodeKey: 'family' as const,
      groups: {
        jazz_styling: { position: 0.15, color: { base: '#f59e0b', light: '#fcd34d' }, label: 'Jazz/Styling' },
        charleston: { position: 0.4, color: { base: '#10b981', light: '#6ee7b7' }, label: 'Charleston' },
        core_lindy: { position: 0.65, color: { base: '#3b82f6', light: '#93c5fd' }, label: 'Core Lindy' },
        aerials_specials: { position: 0.9, color: { base: '#8b5cf6', light: '#c4b5fd' }, label: 'Aerials/Specials' },
      },
    },
    movement: {
      label: 'Movement Family',
      description: '5 mechanic groups',
      nodeKey: 'movementFamily' as const,
      groups: {
        fundamentals: { position: 0.1, color: { base: '#ef4444', light: '#fca5a5' }, label: 'Fundamentals' },
        swingout: { position: 0.3, color: { base: '#3b82f6', light: '#93c5fd' }, label: 'Swingout' },
        turns: { position: 0.5, color: { base: '#8b5cf6', light: '#c4b5fd' }, label: 'Turns' },
        charleston: { position: 0.7, color: { base: '#10b981', light: '#6ee7b7' }, label: 'Charleston' },
        jazz_styling: { position: 0.9, color: { base: '#f59e0b', light: '#fcd34d' }, label: 'Jazz/Styling' },
      },
    },
    position: {
      label: 'Position/Frame',
      description: '5 position groups',
      nodeKey: 'positionFrame' as const,
      groups: {
        closed: { position: 0.1, color: { base: '#ef4444', light: '#fca5a5' }, label: 'Closed' },
        open: { position: 0.3, color: { base: '#3b82f6', light: '#93c5fd' }, label: 'Open' },
        tandem: { position: 0.5, color: { base: '#10b981', light: '#6ee7b7' }, label: 'Tandem/Shadow' },
        side_by_side: { position: 0.7, color: { base: '#f59e0b', light: '#fcd34d' }, label: 'Side-by-Side' },
        solo: { position: 0.9, color: { base: '#8b5cf6', light: '#c4b5fd' }, label: 'Solo' },
      },
    },
  },
  moves,
}

// Write output
const outPath = path.join(__dirname, '../data/lindy-hop.json')
fs.writeFileSync(outPath, JSON.stringify(styleData, null, 2))

console.log(`\nWrote ${outPath}`)
console.log(`  Moves: ${moves.length}`)
console.log(`  Relationships: ${totalRelationships}`)

// Verify classifications
const familyCounts: Record<string, number> = {}
const movementCounts: Record<string, number> = {}
const positionCounts: Record<string, number> = {}
for (const m of moves) {
  familyCounts[m.classifications.family] = (familyCounts[m.classifications.family] || 0) + 1
  movementCounts[m.classifications.movementFamily] = (movementCounts[m.classifications.movementFamily] || 0) + 1
  positionCounts[m.classifications.positionFrame] = (positionCounts[m.classifications.positionFrame] || 0) + 1
}
console.log('\nFamily distribution:', familyCounts)
console.log('Movement distribution:', movementCounts)
console.log('Position distribution:', positionCounts)
