'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { AppShell } from '@/components/AppShell'

// Dynamic import to avoid SSR issues
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-96"><p>Loading graph...</p></div>
})

interface UniversalMove {
  id: string
  name: string
  description: string | null
  tier: number
  category: 'solo' | 'partnered'
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
  description: string | null
  learned: boolean
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

export default function GraphPage() {
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 400, height: 400 })

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

      const nodes: GraphNode[] = universalMoves.map(move => ({
        id: move.id,
        name: move.name,
        tier: move.tier,
        category: move.category || 'partnered',
        description: move.description,
        learned: learnedNames.has(move.name.toLowerCase()),
      }))

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
  }, [])

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
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDimensions({
          width: rect.width,
          height: Math.max(500, window.innerHeight - 200),
        })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Color by category: blue for partnered, red for solo
  // Lighter shade if not learned
  const getNodeColor = (node: GraphNode) => {
    if (node.category === 'solo') {
      return node.learned ? '#ef4444' : '#fca5a5' // red
    } else {
      return node.learned ? '#3b82f6' : '#93c5fd' // blue
    }
  }

  if (loading) {
    return (
      <AppShell title="Move Graph">
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
      <AppShell title="Move Graph">
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
  const soloCount = graphData.nodes.filter(n => n.category === 'solo').length
  const partneredCount = graphData.nodes.filter(n => n.category === 'partnered').length

  return (
    <AppShell title="Move Graph">
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
        <div ref={containerRef} className="bg-gray-900 rounded-lg overflow-hidden relative">
          {/* Legend overlay */}
          <div className="absolute top-4 left-4 bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 z-10 text-sm">
            <div className="text-white font-medium mb-2">Legend</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-gray-300">Partnered ({partneredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-gray-300">Solo/Styling ({soloCount})</span>
              </div>
              <div className="border-t border-gray-600 my-2"></div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-white"></div>
                <span className="text-gray-300">Learned ({learnedCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                <span className="text-gray-300">Not learned ({graphData.nodes.length - learnedCount})</span>
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
          </div>

          <ForceGraph2D
            graphData={graphData}
            width={dimensions.width}
            height={dimensions.height}
            nodeLabel={(node) => {
              const n = node as GraphNode
              return `${n.name} (${n.category})`
            }}
            nodeColor={(node) => getNodeColor(node as GraphNode)}
            nodeRelSize={5}
            nodeVal={(node) => (node as GraphNode).learned ? 1.5 : 1}
            linkWidth={(link) => (link as GraphLink).weight * 2}
            linkColor={(link) => {
              const l = link as GraphLink
              return l.relationType === 'variation' ? '#fb923c' : 'rgba(255,255,255,0.15)'
            }}
            linkLineDash={(link) => {
              const l = link as GraphLink
              return l.relationType === 'variation' ? [4, 2] : null
            }}
            onNodeClick={(node) => setSelectedNode(node as GraphNode)}
            backgroundColor="#111827"
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
