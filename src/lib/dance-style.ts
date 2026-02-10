import * as fs from 'fs'
import * as path from 'path'

// ─── JSON Schema Types ───

export interface StyleColor {
  base: string
  light: string
}

export interface StyleGroup {
  position: number
  color: StyleColor
  label: string
}

export interface StyleScheme {
  label: string
  description: string
  nodeKey: 'family' | 'movementFamily' | 'positionFrame'
  groups: Record<string, StyleGroup>
}

export interface StyleMove {
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

export interface StyleData {
  style: {
    name: string
    slug: string
    description: string
  }
  schemes: Record<string, StyleScheme>
  moves: StyleMove[]
}

export interface StyleMeta {
  name: string
  slug: string
  description: string
  moveCount: number
}

// ─── Loader Functions ───

const DATA_DIR = path.join(process.cwd(), 'data')

export function loadStyleData(slug: string): StyleData {
  const filePath = path.join(DATA_DIR, `${slug}.json`)
  const raw = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(raw) as StyleData
}

export function listStyles(): StyleMeta[] {
  if (!fs.existsSync(DATA_DIR)) return []
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'))
  return files.map(f => {
    const raw = fs.readFileSync(path.join(DATA_DIR, f), 'utf-8')
    const data = JSON.parse(raw) as StyleData
    return {
      name: data.style.name,
      slug: data.style.slug,
      description: data.style.description,
      moveCount: data.moves.length,
    }
  })
}
