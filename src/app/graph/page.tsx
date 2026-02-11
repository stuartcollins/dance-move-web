'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { AppShell } from '@/components/AppShell'

// Dynamic import to avoid SSR issues
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-96"><p>Loading graph...</p></div>
})

// ─── Types from API response ───

interface StyleMeta {
  name: string
  slug: string
  description: string
  moveCount: number
}

interface StyleGroup {
  position: number
  color: { base: string; light: string }
  label: string
}

interface SchemeConfig {
  label: string
  description: string
  nodeKey: 'family' | 'movementFamily' | 'positionFrame'
  groups: Record<string, StyleGroup>
}

interface UniversalMove {
  id: string
  name: string
  description: string | null
  tier: number
  category: 'solo' | 'partnered'
  family: string
  movementFamily: string
  positionFrame: string
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
  category: string
  classifications: Record<string, string> // family, movementFamily, positionFrame
  description: string | null
  learned: boolean
  x?: number
  y?: number
  fx?: number
  fy?: number
  isVariation?: boolean
  parentId?: string
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
  tierStrength: number
  variationStrength: number
  chargeStrength: number
  familyStrength: number
  linkDistance: number
  linkStrength: number
}

const defaultForceParams: ForceParams = {
  tierStrength: 0.3,
  variationStrength: 0.5,
  chargeStrength: -80,
  familyStrength: 0.15,
  linkDistance: 50,
  linkStrength: 0.3,
}

export default function GraphPage() {
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [showControls, setShowControls] = useState(false)
  const [forceParams, setForceParams] = useState<ForceParams>(defaultForceParams)
  const [markingMode, setMarkingMode] = useState(false)
  const [learnedMoveMap, setLearnedMoveMap] = useState<Map<string, string>>(new Map())
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graphRef = useRef<any>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })

  // Style & scheme state
  const [styles, setStyles] = useState<StyleMeta[]>([])
  const [activeStyle, setActiveStyle] = useState('lindy-hop')
  const [schemeConfigs, setSchemeConfigs] = useState<Record<string, SchemeConfig>>({})
  const [activeScheme, setActiveScheme] = useState<string>('hybrid')

  // Relationship type filter — 'all' or a single type
  const relTypes = ['prerequisite', 'variation', 'leads_to', 'related'] as const
  const [activeRelFilter, setActiveRelFilter] = useState<string>('all')

  // Hover highlight state
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)

  // Load available styles on mount
  useEffect(() => {
    fetch('/api/styles').then(r => r.json()).then((data: StyleMeta[]) => {
      if (Array.isArray(data) && data.length > 0) {
        setStyles(data)
      }
    }).catch(() => {})
  }, [])

  const loadGraph = useCallback(async () => {
    try {
      const [seedRes, userRes] = await Promise.all([
        fetch(`/api/graph/seed?style=${activeStyle}`),
        fetch('/api/moves'),
      ])

      const envelope = await seedRes.json()
      const userMoves: UserMove[] = await userRes.json()

      // Parse the new envelope format
      const schemes: Record<string, SchemeConfig> = envelope.schemes || {}
      const universalMoves: UniversalMove[] = envelope.moves || []

      setSchemeConfigs(schemes)

      // If active scheme isn't in this style's schemes, pick the first one
      const schemeKeys = Object.keys(schemes)
      if (schemeKeys.length > 0 && !schemes[activeScheme]) {
        setActiveScheme(schemeKeys[0])
      }

      if (universalMoves.length === 0) {
        setGraphData(null)
        return
      }

      const learnedNames = new Set(userMoves.map(m => m.name.toLowerCase()))
      const newLearnedMap = new Map<string, string>()
      for (const m of userMoves) {
        newLearnedMap.set(m.name.toLowerCase(), m.id)
      }
      setLearnedMoveMap(newLearnedMap)

      // Build variation tracking
      const variationParents = new Map<string, string>()
      for (const move of universalMoves) {
        for (const rel of move.relatedFrom) {
          if (rel.relationType === 'variation') {
            variationParents.set(move.id, rel.toMove.id)
          }
        }
      }

      // First pass: create nodes
      const nodesRaw = universalMoves.map(move => {
        const parentId = variationParents.get(move.id)
        return {
          id: move.id,
          name: move.name,
          tier: move.tier,
          category: move.category,
          classifications: {
            family: move.family,
            movementFamily: move.movementFamily,
            positionFrame: move.positionFrame,
          },
          description: move.description,
          learned: learnedNames.has(move.name.toLowerCase()),
          isVariation: !!parentId,
          parentId,
        }
      })

      const nodeById = new Map(nodesRaw.map(n => [n.id, n]))

      // Second pass: set positions
      const width = Math.min(window.innerWidth - 32, 1280 - 32)
      const height = window.innerHeight - 140
      const margin = width * 0.1
      const usableWidth = width * 0.8

      const currentScheme = schemes[activeScheme] || Object.values(schemes)[0]

      const nodes: GraphNode[] = nodesRaw.map((node) => {
        let tierForPosition = node.tier

        if (node.isVariation && node.parentId) {
          const parent = nodeById.get(node.parentId)
          if (parent) {
            tierForPosition = Math.max(node.tier, parent.tier + 1)
          }
        }
        tierForPosition = Math.min(tierForPosition, 4)

        const tierPosition = (tierForPosition - 1) / 3
        const baseX = margin + tierPosition * usableWidth
        const xOffset = node.isVariation ? 30 : 0

        // Y position based on active scheme
        const nodeGroupKey = node.classifications[currentScheme.nodeKey]
        const group = currentScheme.groups[nodeGroupKey]
        const groupY = (group?.position ?? 0.5) * height
        const baseY = groupY + (Math.random() - 0.5) * (height * 0.15)

        return {
          ...node,
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
            const type = rel.relationType || 'related'
            // Prerequisite and variation are stored child→parent in the data.
            // Swap source/target so arrows point parent→child for readability:
            //   prerequisite: simpler move → advanced move
            //   variation: parent move → variant
            const flip = type === 'prerequisite' || type === 'variation'
            links.push({
              source: flip ? rel.toMove.id : move.id,
              target: flip ? move.id : rel.toMove.id,
              weight: rel.weight,
              relationType: type,
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
  }, [activeStyle, activeScheme])

  const seedGraph = async () => {
    setSeeding(true)
    setError(null)
    try {
      const res = await fetch(`/api/graph/seed?style=${activeStyle}`, { method: 'POST' })
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
      const maxWidth = Math.min(window.innerWidth - 32, 1280 - 32)
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

  // Configure forces
  useEffect(() => {
    if (!graphData || Object.keys(schemeConfigs).length === 0) return

    const applyForces = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fg = graphRef.current as any
      if (!fg || typeof fg.d3Force !== 'function') {
        setTimeout(applyForces, 100)
        return
      }

      const nodeById = new Map(graphData.nodes.map(n => [n.id, n]))

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      import('d3-force-3d').then((d3: any) => {
        fg.d3Force('center', null)

        const margin = dimensions.width * 0.1
        const usableWidth = dimensions.width * 0.8

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tierForce = d3.forceX((node: any) => {
          let tierToUse = node.tier
          if (node.isVariation && node.parentId) {
            const parent = nodeById.get(node.parentId)
            if (parent) {
              tierToUse = Math.min(4, Math.max(node.tier, parent.tier + 1))
            }
          }
          const tierPosition = (tierToUse - 1) / 3
          const variationOffset = node.isVariation ? 30 : 0
          return margin + tierPosition * usableWidth + variationOffset
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }).strength((node: any) =>
          node.isVariation ? forceParams.variationStrength : forceParams.tierStrength
        )

        fg.d3Force('x', tierForce)
        fg.d3Force('charge', d3.forceManyBody().strength(forceParams.chargeStrength))
        fg.d3Force('collide', null)

        const currentScheme = schemeConfigs[activeScheme] || Object.values(schemeConfigs)[0]
        // When filtering to a single relationship type, weaken the group band force
        // and strengthen links so connected nodes cluster together (reduces crossings)
        const isFiltered = activeRelFilter !== 'all'
        const groupStrength = forceParams.familyStrength
        const linkStr = forceParams.linkStrength
        const linkDist = forceParams.linkDistance

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const groupForce = d3.forceY((node: any) => {
          const groupKey = node.classifications[currentScheme.nodeKey]
          const group = currentScheme.groups[groupKey]
          return (group?.position ?? 0.5) * dimensions.height
        }).strength(groupStrength)
        fg.d3Force('y', groupForce)

        const linkForce = fg.d3Force('link')
        if (linkForce) {
          linkForce.distance(linkDist).strength(linkStr)
        }

        const variationNodes = graphData.nodes.filter(n => n.isVariation && n.parentId)
        fg.d3Force('variationRight', () => {
          for (const node of variationNodes) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const nodeAny = node as any
            const parent = nodeById.get(node.parentId!)
            if (parent) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const parentAny = parent as any
              if (nodeAny.x !== undefined && parentAny.x !== undefined) {
                const minOffset = 40
                if (nodeAny.x < parentAny.x + minOffset) {
                  nodeAny.vx = (nodeAny.vx || 0) + 3
                }
              }
            }
          }
        })

        // Custom force: spread siblings (nodes sharing a link target) apart vertically.
        // Only active when filtering to a single relationship type.
        if (isFiltered) {
          // Build sibling groups from the filtered links
          const filteredLinks = graphData.links.filter(l => l.relationType === activeRelFilter)
          const parentToChildren = new Map<string, string[]>()
          for (const link of filteredLinks) {
            const src = typeof link.source === 'object' ? (link.source as GraphNode).id : link.source
            const tgt = typeof link.target === 'object' ? (link.target as GraphNode).id : link.target
            // Group by source (parent side) — children are the targets
            if (!parentToChildren.has(src)) parentToChildren.set(src, [])
            parentToChildren.get(src)!.push(tgt)
          }

          fg.d3Force('spreadSiblings', () => {
            const minGap = 40
            for (const [, children] of parentToChildren) {
              if (children.length < 2) continue
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const childNodes = children.map(id => nodeById.get(id)).filter(Boolean) as any[]
              // Sort by current Y position
              childNodes.sort((a: { y?: number }, b: { y?: number }) => (a.y ?? 0) - (b.y ?? 0))
              // Push apart if too close
              for (let i = 0; i < childNodes.length - 1; i++) {
                const a = childNodes[i]
                const b = childNodes[i + 1]
                if (a.y !== undefined && b.y !== undefined) {
                  const gap = b.y - a.y
                  if (gap < minGap) {
                    const push = (minGap - gap) * 0.3
                    a.vy = (a.vy || 0) - push
                    b.vy = (b.vy || 0) + push
                  }
                }
              }
            }
          })

          // Pull children toward their parent's Y position to reduce line crossings
          fg.d3Force('parentYPull', () => {
            for (const [parentId, children] of parentToChildren) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const parentNode = nodeById.get(parentId) as any
              if (!parentNode || parentNode.y === undefined) continue
              for (const childId of children) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const childNode = nodeById.get(childId) as any
                if (!childNode || childNode.y === undefined) continue
                const dy = parentNode.y - childNode.y
                childNode.vy = (childNode.vy || 0) + dy * 0.03
              }
            }
          })
        } else {
          fg.d3Force('spreadSiblings', null)
          fg.d3Force('parentYPull', null)
        }

        fg.d3ReheatSimulation()
      })
    }

    const timer = setTimeout(applyForces, 200)
    return () => clearTimeout(timer)
  }, [graphData, dimensions, forceParams, activeScheme, schemeConfigs, activeRelFilter])

  // Color by active scheme
  const getNodeColor = useCallback((node: GraphNode) => {
    const currentScheme = schemeConfigs[activeScheme] || Object.values(schemeConfigs)[0]
    if (!currentScheme) return node.learned ? '#3b82f6' : '#93c5fd'
    const groupKey = node.classifications[currentScheme.nodeKey]
    const group = currentScheme.groups[groupKey] || Object.values(currentScheme.groups)[0]
    return node.learned ? group.color.base : group.color.light
  }, [activeScheme, schemeConfigs])

  // Draw axis labels
  const tierLabels = [
    { tier: 1, label: 'Tier 1: Fundamentals' },
    { tier: 2, label: 'Tier 2: Basics' },
    { tier: 3, label: 'Tier 3: Intermediate' },
    { tier: 4, label: 'Tier 4: Advanced' },
  ]

  const drawAxisLabels = useCallback((ctx: CanvasRenderingContext2D, globalScale: number) => {
    if (!graphData || Object.keys(schemeConfigs).length === 0) return

    const width = dimensions.width
    const height = dimensions.height
    const margin = width * 0.1
    const usableWidth = width * 0.8
    const currentScheme = schemeConfigs[activeScheme] || Object.values(schemeConfigs)[0]
    if (!currentScheme) return

    const fontSize = Math.max(10, 14 / globalScale)
    const largeFontSize = Math.max(12, 16 / globalScale)

    // Tier labels along X-axis
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    const tierLabelY = height * 1.02
    for (const { tier, label } of tierLabels) {
      const tierX = margin + ((tier - 1) / 3) * usableWidth

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

      ctx.fillStyle = 'rgba(156, 163, 175, 0.9)'
      ctx.fillText(label, tierX, tierLabelY)
    }

    // Group band labels along Y-axis
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    ctx.font = `bold ${largeFontSize}px Sans-Serif`

    const labelX = margin - 15

    for (const [key, group] of Object.entries(currentScheme.groups)) {
      const labelY = group.position * height
      const label = group.label || key
      const color = group.color?.base || '#9ca3af'

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

      ctx.fillStyle = color
      ctx.fillText(label, labelX, labelY)
    }
  }, [graphData, dimensions, activeScheme, schemeConfigs])

  // Filter links by active relationship type (computed before early returns to keep hook order stable)
  const filteredLinks = useMemo(() => {
    if (!graphData) return []
    return activeRelFilter === 'all'
      ? graphData.links
      : graphData.links.filter(l => l.relationType === activeRelFilter)
  }, [graphData, activeRelFilter])

  // Compute set of nodes connected to hovered node
  const hoveredConnected = useMemo(() => {
    if (!hoveredNode) return null
    const connected = new Set<string>()
    connected.add(hoveredNode.id)
    for (const link of filteredLinks) {
      const src = typeof link.source === 'object' ? (link.source as GraphNode).id : link.source
      const tgt = typeof link.target === 'object' ? (link.target as GraphNode).id : link.target
      if (src === hoveredNode.id) connected.add(tgt as string)
      if (tgt === hoveredNode.id) connected.add(src as string)
    }
    return connected
  }, [hoveredNode, filteredLinks])

  // Memoize filteredGraphData so hover state changes don't create a new reference
  // (which would cause react-force-graph-2d to reheat the simulation)
  const filteredGraphData = useMemo<GraphData | null>(() => {
    if (!graphData) return null
    return { nodes: graphData.nodes, links: filteredLinks }
  }, [graphData, filteredLinks])

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
            Generate a graph of dance moves and their relationships.
          </p>
          {styles.length > 1 && (
            <div className="mb-4">
              <select
                value={activeStyle}
                onChange={(e) => setActiveStyle(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {styles.map(s => (
                  <option key={s.slug} value={s.slug}>{s.name} ({s.moveCount} moves)</option>
                ))}
              </select>
            </div>
          )}
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

  // Relationship type display config
  const relTypeConfig: Record<string, { label: string; color: string; dash: number[] | null }> = {
    prerequisite: { label: 'Prerequisite', color: '#60a5fa', dash: null },
    variation: { label: 'Variation', color: '#fb923c', dash: [4, 2] },
    leads_to: { label: 'Leads To', color: '#34d399', dash: null },
    related: { label: 'Related', color: 'rgba(255,255,255,0.25)', dash: null },
  }

  const learnedCount = graphData.nodes.filter(n => n.learned).length
  const currentScheme = schemeConfigs[activeScheme] || Object.values(schemeConfigs)[0]
  const groupCounts: Record<string, number> = {}
  if (currentScheme) {
    for (const key of Object.keys(currentScheme.groups)) {
      groupCounts[key] = graphData.nodes.filter(n => n.classifications[currentScheme.nodeKey] === key).length
    }
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
            {/* Style selector (only if multiple styles) */}
            {styles.length > 1 && (
              <>
                <div className="text-white font-medium mb-1">Dance Style</div>
                <select
                  value={activeStyle}
                  onChange={(e) => { setActiveStyle(e.target.value); setLoading(true) }}
                  className="w-full bg-gray-700 text-white text-xs rounded px-2 py-1 mb-2"
                >
                  {styles.map(s => (
                    <option key={s.slug} value={s.slug}>{s.name}</option>
                  ))}
                </select>
                <div className="border-t border-gray-600 my-2"></div>
              </>
            )}
            {/* Radio button scheme switcher */}
            <div className="text-white font-medium mb-2">View By</div>
            <div className="space-y-1 mb-3">
              {Object.entries(schemeConfigs).map(([key, scheme]) => (
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
                    {scheme.label}
                    <span className="text-gray-500 ml-1">({scheme.description})</span>
                  </span>
                </label>
              ))}
            </div>
            <div className="border-t border-gray-600 my-2"></div>
            {/* Dynamic legend based on active scheme */}
            {currentScheme && (
              <div className="space-y-1.5">
                {Object.entries(currentScheme.groups).map(([key, group]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: group.color.base }}></div>
                    <span className="text-gray-300 text-xs">{group.label} ({groupCounts[key] || 0})</span>
                  </div>
                ))}
              </div>
            )}
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
            </div>
            <div className="border-t border-gray-600 my-2"></div>
            {/* Relationship type filter */}
            <div className="text-white font-medium mb-1.5">Relationships</div>
            <div className="space-y-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="relType"
                  checked={activeRelFilter === 'all'}
                  onChange={() => setActiveRelFilter('all')}
                  className="accent-indigo-500"
                />
                <span className={`text-xs ${activeRelFilter === 'all' ? 'text-white' : 'text-gray-400'}`}>
                  All ({graphData.links.length})
                </span>
              </label>
              {relTypes.map(type => {
                const config = relTypeConfig[type]
                const count = graphData.links.filter(l => l.relationType === type).length
                return (
                  <label key={type} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="relType"
                      checked={activeRelFilter === type}
                      onChange={() => setActiveRelFilter(type)}
                      className="accent-indigo-500"
                    />
                    <div className="w-4 h-0.5 flex-shrink-0" style={{
                      backgroundColor: config.color,
                      ...(config.dash ? { backgroundImage: `repeating-linear-gradient(90deg, ${config.color} 0, ${config.color} 3px, transparent 3px, transparent 6px)` } : {}),
                    }}></div>
                    <span className={`text-xs ${activeRelFilter === type ? 'text-white' : 'text-gray-400'}`}>
                      {config.label} ({count})
                    </span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Stats overlay */}
          <div className="absolute top-4 right-4 bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 z-10 text-sm">
            <div className="text-white font-medium">{graphData.nodes.length} moves</div>
            <div className="text-gray-400 text-xs">{filteredGraphData!.links.length} connections</div>
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
            graphData={filteredGraphData!}
            width={dimensions.width}
            height={dimensions.height}
            nodeLabel={(node) => {
              const n = node as GraphNode
              return `${n.name} (${n.category})`
            }}
            nodeColor={(node) => {
              const n = node as GraphNode
              if (hoveredConnected && !hoveredConnected.has(n.id)) {
                return 'rgba(100,100,100,0.15)'
              }
              return getNodeColor(n)
            }}
            nodeRelSize={5}
            nodeVal={1}
            linkWidth={(link) => {
              const l = link as GraphLink
              if (hoveredConnected) {
                const src = typeof l.source === 'object' ? (l.source as GraphNode).id : l.source
                const tgt = typeof l.target === 'object' ? (l.target as GraphNode).id : l.target
                if (!hoveredConnected.has(src as string) || !hoveredConnected.has(tgt as string)) {
                  return 0.3
                }
              }
              return l.weight * 2
            }}
            linkColor={(link) => {
              const l = link as GraphLink
              if (hoveredConnected) {
                const src = typeof l.source === 'object' ? (l.source as GraphNode).id : l.source
                const tgt = typeof l.target === 'object' ? (l.target as GraphNode).id : l.target
                if (!hoveredConnected.has(src as string) || !hoveredConnected.has(tgt as string)) {
                  return 'rgba(255,255,255,0.03)'
                }
              }
              return relTypeConfig[l.relationType]?.color || 'rgba(255,255,255,0.15)'
            }}
            linkCurvature={0.15}
            linkLineDash={(link) => {
              const l = link as GraphLink
              return relTypeConfig[l.relationType]?.dash || null
            }}
            linkDirectionalArrowLength={(link) => {
              const l = link as GraphLink
              return l.relationType === 'related' ? 0 : 12
            }}
            linkDirectionalArrowRelPos={0.9}
            linkDirectionalArrowColor={(link) => {
              const l = link as GraphLink
              return relTypeConfig[l.relationType]?.color || 'rgba(255,255,255,0.15)'
            }}
            onNodeHover={(node) => {
              setHoveredNode(node ? node as GraphNode : null)
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
                const userMoveId = learnedMoveMap.get(key)
                if (userMoveId) {
                  try {
                    await fetch(`/api/moves/${userMoveId}`, { method: 'DELETE' })
                    setLearnedMoveMap(prev => { const next = new Map(prev); next.delete(key); return next })
                  } catch { return }
                }
              } else {
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
              n.learned = !n.learned
              setGraphData(prev => prev ? { ...prev } : prev)
            }}
            backgroundColor="#111827"
            onRenderFramePost={(ctx, globalScale) => drawAxisLabels(ctx, globalScale)}
            nodeCanvasObjectMode={() => 'after'}
            nodeCanvasObject={(node, ctx, globalScale) => {
              const n = node as GraphNode & { x: number; y: number }
              if (globalScale < 0.5) return

              const label = n.name
              const fontSize = Math.min(12 / globalScale, 14)
              ctx.font = `${fontSize}px Sans-Serif`
              ctx.textAlign = 'center'
              ctx.textBaseline = 'middle'
              const dimmed = hoveredConnected && !hoveredConnected.has(n.id)
              ctx.fillStyle = dimmed ? 'rgba(255,255,255,0.08)' : (n.learned ? '#fff' : 'rgba(255,255,255,0.5)')
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
