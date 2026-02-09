'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { AppShell } from '@/components/AppShell'

// Dynamic import to avoid SSR issues
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-96"><p>Loading graph...</p></div>
})

// Option 4: Hybrid families
type MoveFamily = 'core_lindy' | 'charleston' | 'jazz_styling' | 'aerials_specials'
// Option 1: Movement families
type MovementFamily = 'swingout' | 'charleston' | 'turns' | 'jazz_styling' | 'fundamentals'
// Option 2: Position/Frame
type PositionFrame = 'closed' | 'open' | 'tandem' | 'side_by_side' | 'solo'

type CategorizationScheme = 'hybrid' | 'movement' | 'position'

interface UniversalMove {
  id: string
  name: string
  description: string | null
  tier: number
  category: 'solo' | 'partnered'
  family: MoveFamily
  movementFamily: MovementFamily
  positionFrame: PositionFrame
  relatedFrom: { toMove: { id: string; name: string }; weight: number; relationType: string }[]
  relatedTo: { fromMove: { id: string; name: string }; weight: number; relationType: string }[]
}

interface UserMove {
  id: string
  name: string
}

interface GraphNode {
  id: string
  name: string
  tier: number
  category: 'solo' | 'partnered'
  family: MoveFamily
  movementFamily: MovementFamily
  positionFrame: PositionFrame
  description: string | null
  learned: boolean
  // Positioning
  x?: number
  y?: number
  fx?: number // Fixed x position (locks horizontal position)
  fy?: number // Fixed y position (locks vertical position)
  isVariation?: boolean
  parentId?: string // ID of parent node if this is a variation
}

interface GraphLink {
  source: string
  target: string
  weight: number
  relationType: string
}

interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

// Force tuning parameters
interface ForceParams {
  tierStrength: number      // How strongly nodes stick to their tier (0-1)
  variationStrength: number // How strongly variations stick near parent (0-1)
  chargeStrength: number    // Repulsion between nodes (negative = repel)
  familyStrength: number    // How strongly nodes separate by family (0-1)
  linkDistance: number      // Distance between linked nodes
  linkStrength: number      // How strongly links pull nodes together (0-1)
}

const defaultForceParams: ForceParams = {
  tierStrength: 0.3,
  variationStrength: 0.5,
  chargeStrength: -80,
  familyStrength: 0.15,
  linkDistance: 50,
  linkStrength: 0.3,
}

// === Categorization Scheme Configurations ===

interface SchemeConfig {
  label: string
  description: string
  positions: Record<string, number>
  colors: Record<string, { base: string; light: string }>
  labels: Record<string, string>
  nodeKey: 'family' | 'movementFamily' | 'positionFrame'
}

const schemeConfigs: Record<CategorizationScheme, SchemeConfig> = {
  hybrid: {
    label: 'Hybrid',
    description: '4 practical groups',
    positions: {
      'jazz_styling': 0.15,
      'charleston': 0.4,
      'core_lindy': 0.65,
      'aerials_specials': 0.9,
    },
    colors: {
      'jazz_styling': { base: '#f59e0b', light: '#fcd34d' },
      'charleston': { base: '#10b981', light: '#6ee7b7' },
      'core_lindy': { base: '#3b82f6', light: '#93c5fd' },
      'aerials_specials': { base: '#8b5cf6', light: '#c4b5fd' },
    },
    labels: {
      'jazz_styling': 'Jazz/Styling',
      'charleston': 'Charleston',
      'core_lindy': 'Core Lindy',
      'aerials_specials': 'Aerials/Specials',
    },
    nodeKey: 'family',
  },
  movement: {
    label: 'Movement Family',
    description: '5 mechanic groups',
    positions: {
      'fundamentals': 0.1,
      'swingout': 0.3,
      'turns': 0.5,
      'charleston': 0.7,
      'jazz_styling': 0.9,
    },
    colors: {
      'fundamentals': { base: '#ef4444', light: '#fca5a5' },
      'swingout': { base: '#3b82f6', light: '#93c5fd' },
      'turns': { base: '#8b5cf6', light: '#c4b5fd' },
      'charleston': { base: '#10b981', light: '#6ee7b7' },
      'jazz_styling': { base: '#f59e0b', light: '#fcd34d' },
    },
    labels: {
      'fundamentals': 'Fundamentals',
      'swingout': 'Swingout',
      'turns': 'Turns',
      'charleston': 'Charleston',
      'jazz_styling': 'Jazz/Styling',
    },
    nodeKey: 'movementFamily',
  },
  position: {
    label: 'Position/Frame',
    description: '5 position groups',
    positions: {
      'closed': 0.1,
      'open': 0.3,
      'tandem': 0.5,
      'side_by_side': 0.7,
      'solo': 0.9,
    },
    colors: {
      'closed': { base: '#ef4444', light: '#fca5a5' },
      'open': { base: '#3b82f6', light: '#93c5fd' },
      'tandem': { base: '#10b981', light: '#6ee7b7' },
      'side_by_side': { base: '#f59e0b', light: '#fcd34d' },
      'solo': { base: '#8b5cf6', light: '#c4b5fd' },
    },
    labels: {
      'closed': 'Closed',
      'open': 'Open',
      'tandem': 'Tandem/Shadow',
      'side_by_side': 'Side-by-Side',
      'solo': 'Solo',
    },
    nodeKey: 'positionFrame',
  },
}

export default function GraphPage() {
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [showControls, setShowControls] = useState(false)
  const [activeScheme, setActiveScheme] = useState<CategorizationScheme>('hybrid')
  const [forceParams, setForceParams] = useState<ForceParams>(defaultForceParams)
  const [markingMode, setMarkingMode] = useState(false)
  const [learnedMoveMap, setLearnedMoveMap] = useState<Map<string, string>>(new Map()) // lowercaseName → userMoveId
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graphRef = useRef<any>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })

  const loadGraph = useCallback(async () => {
    try {
      const [universalRes, userRes] = await Promise.all([
        fetch('/api/graph/seed'),
        fetch('/api/moves'),
      ])

      const universalMoves: UniversalMove[] = await universalRes.json()
      const userMoves: UserMove[] = await userRes.json()

      if (!Array.isArray(universalMoves) || universalMoves.length === 0) {
        setGraphData(null)
        return
      }

      const learnedNames = new Set(userMoves.map(m => m.name.toLowerCase()))
      const newLearnedMap = new Map<string, string>()
      for (const m of userMoves) {
        newLearnedMap.set(m.name.toLowerCase(), m.id)
      }
      setLearnedMoveMap(newLearnedMap)

      // Build a map of move IDs to their names for variation tracking
      const moveIdToName = new Map<string, string>()
      const moveNameToId = new Map<string, string>()
      for (const move of universalMoves) {
        moveIdToName.set(move.id, move.name)
        moveNameToId.set(move.name.toLowerCase(), move.id)
      }

      // Track which nodes are variations and their parents
      // If move A has relatedMoves: [{ name: "B", type: "variation" }]
      // It means A is declaring itself as a variation OF B (B is the parent)
      const variationParents = new Map<string, string>() // variationId -> parentId
      for (const move of universalMoves) {
        for (const rel of move.relatedFrom) {
          if (rel.relationType === 'variation') {
            // This move declared a variation relationship TO rel.toMove
            // Meaning: THIS MOVE is a variation of rel.toMove
            // So this move is the variation, rel.toMove is the parent
            variationParents.set(move.id, rel.toMove.id)
          }
        }
        // Note: We don't need to process relatedTo for variations
        // because the relationship is defined from the variation's side
      }

      // First pass: create nodes without positions
      const nodesRaw = universalMoves.map(move => {
        const parentId = variationParents.get(move.id)
        return {
          id: move.id,
          name: move.name,
          tier: move.tier,
          category: (move.category || 'partnered') as 'solo' | 'partnered',
          family: (move.family || 'core_lindy') as MoveFamily,
          movementFamily: (move.movementFamily || 'fundamentals') as MovementFamily,
          positionFrame: (move.positionFrame || 'open') as PositionFrame,
          description: move.description,
          learned: learnedNames.has(move.name.toLowerCase()),
          isVariation: !!parentId,
          parentId,
        }
      })

      // Build lookup for parent tiers
      const nodeById = new Map(nodesRaw.map(n => [n.id, n]))

      // Second pass: set FIXED x positions based on tier
      // Using fx (fixed x) locks nodes horizontally while allowing vertical movement
      const width = Math.min(window.innerWidth - 32, 1280 - 32)
      const height = window.innerHeight - 140
      const margin = width * 0.1
      const usableWidth = width * 0.8

      // Group nodes by tier for vertical distribution
      const tierGroups: Map<number, typeof nodesRaw> = new Map()
      for (const node of nodesRaw) {
        let tierForPosition = node.tier
        if (node.isVariation && node.parentId) {
          const parent = nodeById.get(node.parentId)
          if (parent) tierForPosition = Math.max(node.tier, parent.tier + 1)
        }
        tierForPosition = Math.min(tierForPosition, 4) // cap at tier 4
        if (!tierGroups.has(tierForPosition)) {
          tierGroups.set(tierForPosition, [])
        }
        tierGroups.get(tierForPosition)!.push(node)
      }

      const nodes: GraphNode[] = nodesRaw.map((node) => {
        let tierForPosition = node.tier

        // Variations always appear to the RIGHT of their parent
        // Use the higher of: own tier, or parent tier + 1
        if (node.isVariation && node.parentId) {
          const parent = nodeById.get(node.parentId)
          if (parent) {
            tierForPosition = Math.max(node.tier, parent.tier + 1)
          }
        }
        tierForPosition = Math.min(tierForPosition, 4) // cap at tier 4

        // Calculate x position based on tier (1-4 maps to left-right)
        const tierPosition = (tierForPosition - 1) / 3 // 0 to 1
        const baseX = margin + tierPosition * usableWidth

        // Add small offset for variations to separate from non-variation nodes at same tier
        const xOffset = node.isVariation ? 30 : 0

        // Calculate Y position based on active categorization scheme
        const scheme = schemeConfigs[activeScheme]
        const nodeGroupKey = node[scheme.nodeKey] as string
        const groupY = (scheme.positions[nodeGroupKey] ?? 0.5) * height
        // Add some randomness within family band
        const baseY = groupY + (Math.random() - 0.5) * (height * 0.15)

        return {
          ...node,
          // Set initial positions (NOT fixed - allow movement)
          x: baseX + xOffset + (Math.random() - 0.5) * 40,
          y: baseY,
        } as GraphNode
      })

      const links: GraphLink[] = []
      const linkSet = new Set<string>()

      for (const move of universalMoves) {
        for (const rel of move.relatedFrom) {
          const key = [move.id, rel.toMove.id].sort().join('-')
          if (!linkSet.has(key)) {
            linkSet.add(key)
            links.push({
              source: move.id,
              target: rel.toMove.id,
              weight: rel.weight,
              relationType: rel.relationType || 'related',
            })
          }
        }
      }

      setGraphData({ nodes, links })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load graph')
    } finally {
      setLoading(false)
    }
  }, [activeScheme])

  const seedGraph = async () => {
    setSeeding(true)
    setError(null)
    try {
      const res = await fetch('/api/graph/seed', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        await loadGraph()
      } else {
        setError(data.error || 'Failed to seed graph')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seed graph')
    } finally {
      setSeeding(false)
    }
  }

  useEffect(() => {
    loadGraph()
  }, [loadGraph])

  useEffect(() => {
    const updateDimensions = () => {
      // Calculate available width: min of window width or max-w-7xl (1280px), minus padding
      const maxWidth = Math.min(window.innerWidth - 32, 1280 - 32)
      // Calculate available height: viewport minus header, nav, and padding
      const availableHeight = window.innerHeight - 140

      setDimensions({
        width: Math.max(300, maxWidth),
        height: Math.max(500, availableHeight),
      })
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Configure forces for tier-based horizontal layout with relationship blending
  useEffect(() => {
    if (!graphData) return

    // Wait for the graph component to be ready
    const applyForces = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fg = graphRef.current as any
      if (!fg || typeof fg.d3Force !== 'function') {
        // Retry if not ready yet
        setTimeout(applyForces, 100)
        return
      }

      // Build a map for quick parent lookup
      const nodeById = new Map(graphData.nodes.map(n => [n.id, n]))

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      import('d3-force-3d').then((d3: any) => {
        // Remove default center force - our custom X/Y forces handle positioning
        fg.d3Force('center', null)

        const margin = dimensions.width * 0.1
        const usableWidth = dimensions.width * 0.8

        // Create a forceX that biases nodes toward their tier position
        // Variations always to the RIGHT of their parent
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tierForce = d3.forceX((node: any) => {
          let tierToUse = node.tier

          // Variations: use the higher of own tier or parent tier + 1
          if (node.isVariation && node.parentId) {
            const parent = nodeById.get(node.parentId)
            if (parent) {
              tierToUse = Math.min(4, Math.max(node.tier, parent.tier + 1))
            }
          }

          const tierPosition = (tierToUse - 1) / 3
          // Small additional offset for variations to separate from same-tier non-variations
          const variationOffset = node.isVariation ? 30 : 0
          return margin + tierPosition * usableWidth + variationOffset
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }).strength((node: any) =>
          node.isVariation ? forceParams.variationStrength : forceParams.tierStrength
        )

        fg.d3Force('x', tierForce)

        // Charge force for repulsion/spreading
        fg.d3Force('charge', d3.forceManyBody().strength(forceParams.chargeStrength))

        // Y force: pull nodes toward their group's Y position based on active scheme
        const scheme = schemeConfigs[activeScheme]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const groupForce = d3.forceY((node: any) => {
          const groupKey = node[scheme.nodeKey] as string
          return (scheme.positions[groupKey] ?? 0.5) * dimensions.height
        }).strength(forceParams.familyStrength)
        fg.d3Force('y', groupForce)

        // Link force pulls connected nodes together
        const linkForce = fg.d3Force('link')
        if (linkForce) {
          linkForce.distance(forceParams.linkDistance).strength(forceParams.linkStrength)
        }

        // Custom force: keep variations to the RIGHT of their parent
        // This runs each tick and pushes variations right if they drift left of parent
        const variationNodes = graphData.nodes.filter(n => n.isVariation && n.parentId)
        fg.d3Force('variationRight', () => {
          for (const node of variationNodes) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const nodeAny = node as any
            const parent = nodeById.get(node.parentId!)
            if (parent) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const parentAny = parent as any
              // If variation is left of or too close to parent, push it right
              if (nodeAny.x !== undefined && parentAny.x !== undefined) {
                const minOffset = 40 // Minimum distance to the right
                if (nodeAny.x < parentAny.x + minOffset) {
                  nodeAny.vx = (nodeAny.vx || 0) + 3 // Push right
                }
              }
            }
          }
        })

        // Reheat to apply new forces
        fg.d3ReheatSimulation()
      })
    }

    // Start trying to apply forces after a short delay
    const timer = setTimeout(applyForces, 200)
    return () => clearTimeout(timer)
  }, [graphData, dimensions, forceParams, activeScheme])

  // Color by active categorization scheme, with lighter shade if not learned
  const getNodeColor = useCallback((node: GraphNode) => {
    const scheme = schemeConfigs[activeScheme]
    const groupKey = node[scheme.nodeKey] as string
    const colors = scheme.colors[groupKey] || Object.values(scheme.colors)[0]
    return node.learned ? colors.base : colors.light
  }, [activeScheme])

  // Draw tier (X-axis) and category (Y-axis) labels on the canvas so they move with pan/zoom
  const tierLabels = [
    { tier: 1, label: 'Tier 1: Fundamentals' },
    { tier: 2, label: 'Tier 2: Basics' },
    { tier: 3, label: 'Tier 3: Intermediate' },
    { tier: 4, label: 'Tier 4: Advanced' },
  ]

  const drawAxisLabels = useCallback((ctx: CanvasRenderingContext2D, globalScale: number) => {
    if (!graphData) return

    const width = dimensions.width
    const height = dimensions.height
    const margin = width * 0.1
    const usableWidth = width * 0.8
    const scheme = schemeConfigs[activeScheme]

    // Font size that stays readable as you zoom (shrinks in world coords as you zoom in)
    const fontSize = Math.max(10, 14 / globalScale)
    const largeFontSize = Math.max(12, 16 / globalScale)

    // --- Tier labels along the X-axis (below the node area) ---
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    const tierLabelY = height * 1.02 // below the lowest band (0.9 * height)
    for (const { tier, label } of tierLabels) {
      const tierX = margin + ((tier - 1) / 3) * usableWidth

      // Background pill
      ctx.font = `${fontSize}px Sans-Serif`
      const textWidth = ctx.measureText(label).width
      const padding = 6 / globalScale
      ctx.fillStyle = 'rgba(31, 41, 55, 0.85)'
      ctx.beginPath()
      const radius = 4 / globalScale
      const rx = tierX - textWidth / 2 - padding
      const ry = tierLabelY - padding / 2
      const rw = textWidth + padding * 2
      const rh = fontSize + padding
      ctx.roundRect(rx, ry, rw, rh, radius)
      ctx.fill()

      // Text
      ctx.fillStyle = 'rgba(156, 163, 175, 0.9)'
      ctx.fillText(label, tierX, tierLabelY)
    }

    // --- Category band labels along the Y-axis (left of the node area) ---
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    ctx.font = `bold ${largeFontSize}px Sans-Serif`

    const labelX = margin - 15 // to the left of where Tier 1 nodes sit

    for (const [key, yFraction] of Object.entries(scheme.positions)) {
      const labelY = yFraction * height
      const label = scheme.labels[key] || key
      const color = scheme.colors[key]?.base || '#9ca3af'

      // Background pill
      const textWidth = ctx.measureText(label).width
      const padding = 6 / globalScale
      ctx.fillStyle = 'rgba(31, 41, 55, 0.85)'
      ctx.beginPath()
      const radius = 4 / globalScale
      ctx.roundRect(
        labelX - textWidth - padding,
        labelY - largeFontSize / 2 - padding / 2,
        textWidth + padding * 2,
        largeFontSize + padding,
        radius
      )
      ctx.fill()

      // Colored text
      ctx.fillStyle = color
      ctx.fillText(label, labelX, labelY)
    }
  }, [graphData, dimensions, activeScheme])

  if (loading) {
    return (
      <AppShell title="Move Graph" fullWidth>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-4"></div>
            <p className="text-gray-600">Loading move graph...</p>
          </div>
        </div>
      </AppShell>
    )
  }

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <AppShell title="Move Graph" fullWidth>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Build the Move Universe</h2>
          <p className="text-gray-600 max-w-sm mx-auto mb-6">
            Generate a graph of Lindy Hop moves and their relationships.
          </p>
          {error && (
            <p className="text-red-600 mb-4">{error}</p>
          )}
          <button
            onClick={seedGraph}
            disabled={seeding}
            className="bg-indigo-600 text-white rounded-lg py-3 px-6 font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {seeding ? 'Generating...' : 'Generate Move Graph'}
          </button>
        </div>
      </AppShell>
    )
  }

  const learnedCount = graphData.nodes.filter(n => n.learned).length
  const scheme = schemeConfigs[activeScheme]
  const groupCounts: Record<string, number> = {}
  for (const key of Object.keys(scheme.labels)) {
    groupCounts[key] = graphData.nodes.filter(n => (n[scheme.nodeKey] as string) === key).length
  }

  return (
    <AppShell title="Move Graph" fullWidth>
      <div className="space-y-4">
        {/* Selected node info */}
        {selectedNode && (
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-gray-900">{selectedNode.name}</h3>
                <div className="flex gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    selectedNode.category === 'solo'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {selectedNode.category === 'solo' ? 'Solo/Styling' : 'Partnered'}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    selectedNode.learned ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {selectedNode.learned ? 'Learned' : 'Not learned'}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    Tier {selectedNode.tier}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {selectedNode.description && (
              <p className="text-sm text-gray-600 mt-2">{selectedNode.description}</p>
            )}
          </div>
        )}

        {/* Graph with legend overlay */}
        <div
          ref={containerRef}
          className="bg-gray-900 rounded-lg overflow-hidden relative w-full"
          style={{ height: `${dimensions.height}px`, cursor: markingMode ? 'pointer' : undefined }}
        >
          {/* Legend overlay with scheme switcher */}
          <div className="absolute top-4 left-4 bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 z-10 text-sm">
            {/* Radio button scheme switcher */}
            <div className="text-white font-medium mb-2">View By</div>
            <div className="space-y-1 mb-3">
              {(Object.keys(schemeConfigs) as CategorizationScheme[]).map((key) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="scheme"
                    value={key}
                    checked={activeScheme === key}
                    onChange={() => setActiveScheme(key)}
                    className="accent-indigo-500"
                  />
                  <span className={`text-xs ${activeScheme === key ? 'text-white' : 'text-gray-400'}`}>
                    {schemeConfigs[key].label}
                    <span className="text-gray-500 ml-1">({schemeConfigs[key].description})</span>
                  </span>
                </label>
              ))}
            </div>
            <div className="border-t border-gray-600 my-2"></div>
            {/* Dynamic legend based on active scheme */}
            <div className="space-y-1.5">
              {Object.entries(scheme.labels).map(([key, label]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: scheme.colors[key].base }}></div>
                  <span className="text-gray-300 text-xs">{label} ({groupCounts[key] || 0})</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-600 my-2"></div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border-2 border-white"></div>
                <span className="text-gray-300 text-xs">Learned ({learnedCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border-2 border-gray-500"></div>
                <span className="text-gray-300 text-xs">Not learned ({graphData.nodes.length - learnedCount})</span>
              </div>
              <div className="border-t border-gray-600 my-2"></div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-white"></div>
                <span className="text-gray-300 text-xs">Related</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-orange-400" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #fb923c 0, #fb923c 3px, transparent 3px, transparent 6px)' }}></div>
                <span className="text-gray-300 text-xs">Variation</span>
              </div>
            </div>
          </div>

          {/* Stats overlay */}
          <div className="absolute top-4 right-4 bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 z-10 text-sm">
            <div className="text-white font-medium">{graphData.nodes.length} moves</div>
            <div className="text-gray-400 text-xs">{graphData.links.length} connections</div>
            <button
              onClick={() => setMarkingMode(m => !m)}
              className={`mt-2 w-full text-xs py-1.5 px-3 rounded font-medium transition-colors ${
                markingMode
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {markingMode ? 'Marking Learned ✓' : 'Mark Learned'}
            </button>
            <button
              onClick={() => setShowControls(!showControls)}
              className="mt-2 text-xs text-indigo-400 hover:text-indigo-300"
            >
              {showControls ? 'Hide Controls' : 'Tune Forces'}
            </button>
          </div>

          {/* Force Controls Panel */}
          {showControls && (
            <div className="absolute top-20 right-4 bg-gray-800/95 backdrop-blur-sm rounded-lg p-4 z-10 text-sm w-64">
              <div className="text-white font-medium mb-3">Force Tuning</div>
              <div className="space-y-3">
                <div>
                  <label className="text-gray-300 text-xs block mb-1">
                    Tier Strength: {forceParams.tierStrength.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={forceParams.tierStrength}
                    onChange={(e) => setForceParams(p => ({ ...p, tierStrength: parseFloat(e.target.value) }))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-gray-300 text-xs block mb-1">
                    Variation Strength: {forceParams.variationStrength.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={forceParams.variationStrength}
                    onChange={(e) => setForceParams(p => ({ ...p, variationStrength: parseFloat(e.target.value) }))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-gray-300 text-xs block mb-1">
                    Charge (repulsion): {forceParams.chargeStrength}
                  </label>
                  <input
                    type="range"
                    min="-300"
                    max="0"
                    step="10"
                    value={forceParams.chargeStrength}
                    onChange={(e) => setForceParams(p => ({ ...p, chargeStrength: parseFloat(e.target.value) }))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-gray-300 text-xs block mb-1">
                    Family Separation: {forceParams.familyStrength.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="0.5"
                    step="0.01"
                    value={forceParams.familyStrength}
                    onChange={(e) => setForceParams(p => ({ ...p, familyStrength: parseFloat(e.target.value) }))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-gray-300 text-xs block mb-1">
                    Link Distance: {forceParams.linkDistance}
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="150"
                    step="5"
                    value={forceParams.linkDistance}
                    onChange={(e) => setForceParams(p => ({ ...p, linkDistance: parseFloat(e.target.value) }))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-gray-300 text-xs block mb-1">
                    Link Strength: {forceParams.linkStrength.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={forceParams.linkStrength}
                    onChange={(e) => setForceParams(p => ({ ...p, linkStrength: parseFloat(e.target.value) }))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <button
                  onClick={() => setForceParams(defaultForceParams)}
                  className="w-full mt-2 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 py-1 px-2 rounded"
                >
                  Reset to Defaults
                </button>
              </div>
            </div>
          )}

          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            width={dimensions.width}
            height={dimensions.height}
            nodeLabel={(node) => {
              const n = node as GraphNode
              return `${n.name} (${n.category})`
            }}
            nodeColor={(node) => getNodeColor(node as GraphNode)}
            nodeRelSize={5}
            nodeVal={1}
            linkWidth={(link) => (link as GraphLink).weight * 2}
            linkColor={(link) => {
              const l = link as GraphLink
              return l.relationType === 'variation' ? '#fb923c' : 'rgba(255,255,255,0.15)'
            }}
            linkLineDash={(link) => {
              const l = link as GraphLink
              return l.relationType === 'variation' ? [4, 2] : null
            }}
            onNodeClick={async (node) => {
              const n = node as GraphNode
              if (!markingMode) {
                setSelectedNode(n)
                return
              }
              // Toggle learned status
              const key = n.name.toLowerCase()
              if (n.learned) {
                // Unmark: delete the user move
                const userMoveId = learnedMoveMap.get(key)
                if (userMoveId) {
                  try {
                    await fetch(`/api/moves/${userMoveId}`, { method: 'DELETE' })
                    setLearnedMoveMap(prev => { const next = new Map(prev); next.delete(key); return next })
                  } catch { return }
                }
              } else {
                // Mark as learned: create a user move
                try {
                  const res = await fetch('/api/moves', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: n.name }),
                  })
                  const created = await res.json()
                  if (created.id) {
                    setLearnedMoveMap(prev => new Map(prev).set(key, created.id))
                  }
                } catch { return }
              }
              // Mutate in place to preserve d3 simulation positions, then trigger re-render
              n.learned = !n.learned
              setGraphData(prev => prev ? { ...prev } : prev)
            }}
            backgroundColor="#111827"
            onRenderFramePost={(ctx, globalScale) => drawAxisLabels(ctx, globalScale)}
            nodeCanvasObjectMode={() => 'after'}
            nodeCanvasObject={(node, ctx, globalScale) => {
              const n = node as GraphNode & { x: number; y: number }
              // Only show labels when zoomed in enough
              if (globalScale < 0.5) return

              const label = n.name
              const fontSize = Math.min(12 / globalScale, 14)
              ctx.font = `${fontSize}px Sans-Serif`
              ctx.textAlign = 'center'
              ctx.textBaseline = 'middle'
              ctx.fillStyle = n.learned ? '#fff' : 'rgba(255,255,255,0.5)'
              ctx.fillText(label, n.x, n.y + 8 + (n.learned ? 2 : 0))
            }}
            cooldownTicks={100}
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.3}
          />
        </div>
      </div>
    </AppShell>
  )
}
