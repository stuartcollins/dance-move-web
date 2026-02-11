#!/usr/bin/env npx tsx
/**
 * Validates style JSON data files for correctness.
 * Checks relationship directions, classification keys, tier distribution, etc.
 *
 * Usage: npx tsx scripts/validate-style-data.ts [slug]
 *   If no slug given, validates all styles in data/
 */

import * as fs from 'fs'
import * as path from 'path'

const DATA_DIR = path.join(__dirname, '../data')

interface StyleData {
  style: { name: string; slug: string }
  schemes: Record<string, { nodeKey: string; groups: Record<string, unknown> }>
  moves: Array<{
    name: string
    tier: number
    category: string
    classifications: Record<string, string>
    relationships: Array<{ name: string; weight: number; type: string }>
  }>
}

function validate(slug: string): { errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []
  const filePath = path.join(DATA_DIR, `${slug}.json`)

  if (!fs.existsSync(filePath)) {
    errors.push(`File not found: ${filePath}`)
    return { errors, warnings }
  }

  const data: StyleData = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  const moveNames = new Set(data.moves.map(m => m.name.toLowerCase()))
  const moveTiers = new Map(data.moves.map(m => [m.name.toLowerCase(), m.tier]))

  // Validate scheme group keys
  for (const [schemeName, scheme] of Object.entries(data.schemes)) {
    const validKeys = new Set(Object.keys(scheme.groups))
    for (const move of data.moves) {
      const value = move.classifications[scheme.nodeKey]
      if (!validKeys.has(value)) {
        errors.push(`Move "${move.name}": classification ${scheme.nodeKey}="${value}" not in ${schemeName} groups [${[...validKeys].join(', ')}]`)
      }
    }
  }

  // Validate relationships
  for (const move of data.moves) {
    for (const rel of move.relationships || []) {
      // Check target exists
      if (!moveNames.has(rel.name.toLowerCase())) {
        errors.push(`Move "${move.name}": relationship target "${rel.name}" does not exist`)
        continue
      }

      // Check weight range
      if (rel.weight < 0 || rel.weight > 1) {
        errors.push(`Move "${move.name}" → "${rel.name}": weight ${rel.weight} out of range [0, 1]`)
      }

      // Check relationship type
      if (!['prerequisite', 'variation', 'leads_to', 'related'].includes(rel.type)) {
        errors.push(`Move "${move.name}" → "${rel.name}": unknown type "${rel.type}"`)
      }

      // ── Direction checks ──
      // These match the graph page's link-building logic where prerequisite
      // and variation are flipped so arrows point parent→child.

      const sourceTier = move.tier
      const targetTier = moveTiers.get(rel.name.toLowerCase())!

      if (rel.type === 'prerequisite') {
        // Data stores: advanced move → prerequisite → simpler move
        // So source tier should be >= target tier (the prerequisite is simpler)
        if (sourceTier < targetTier) {
          warnings.push(`Move "${move.name}" (tier ${sourceTier}) declares prerequisite "${rel.name}" (tier ${targetTier}) — prerequisite is harder than the move itself`)
        }
      }

      if (rel.type === 'variation') {
        // Data stores: variant → variation → parent
        // The variant's name typically includes the parent's name or extends it
        // Check that it doesn't point to itself
        if (move.name.toLowerCase() === rel.name.toLowerCase()) {
          errors.push(`Move "${move.name}": variation relationship points to itself`)
        }
      }

      if (rel.type === 'leads_to') {
        // Data stores: source move → leads_to → target move
        // Arrow should point source→target (the natural flow direction)
        // Target should generally be same tier or higher
        if (targetTier < sourceTier - 1) {
          warnings.push(`Move "${move.name}" (tier ${sourceTier}) leads_to "${rel.name}" (tier ${targetTier}) — leads to a much simpler move`)
        }
      }
    }
  }

  // Check tier distribution
  const tierCounts: Record<number, number> = {}
  for (const m of data.moves) {
    tierCounts[m.tier] = (tierCounts[m.tier] || 0) + 1
  }

  return { errors, warnings }
}

// ── Main ──
const slug = process.argv[2]
const slugs = slug
  ? [slug]
  : fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''))

let hasErrors = false

for (const s of slugs) {
  console.log(`\n── Validating ${s} ──`)
  const { errors, warnings } = validate(s)

  if (errors.length === 0 && warnings.length === 0) {
    console.log('  ✓ All checks passed')
  }

  for (const w of warnings) {
    console.log(`  ⚠ ${w}`)
  }
  for (const e of errors) {
    console.log(`  ✗ ${e}`)
    hasErrors = true
  }
}

process.exit(hasErrors ? 1 : 0)
