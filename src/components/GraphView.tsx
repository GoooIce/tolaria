import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ForceGraphBase, {
  type ForceGraphGeneric,
  type NodeObject,
  type GraphData,
} from 'force-graph'
import { MagnifyingGlass, X, Funnel, FolderOpen, Star, Archive } from '@phosphor-icons/react'
import type { VaultEntry } from '../types'
import { entriesToGraph, buildAdjacency, collapseNodesByType, type GraphNode } from '../utils/graphData'
import { translate, type AppLocale } from '../lib/i18n'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Switch } from './ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

/** The chainable instance returned by `ForceGraph()(el)`. We type only the
 *  methods we actually call, casting through unknown once at the factory
 *  boundary (the library's shipped class doubles as a runtime factory). */
interface GraphInstance extends ForceGraphGeneric<GraphInstance, NodeObject> {
  _destructor(): void
}

const buildGraphInstance = (el: HTMLElement): GraphInstance => {
  // Runtime API: ForceGraph()(el) — class invoked as zero-arg factory,
  // then the returned initializer is called with the container element.
  const factory = ForceGraphBase as unknown as () => (el: HTMLElement) => GraphInstance
  return factory()(el)
}

/** Narrow a runtime node back to our GraphNode (which carries label/color/entry). */
const asGraphNode = (node: NodeObject): GraphNode & NodeObject => node as GraphNode & NodeObject

interface GraphViewProps {
  entries: VaultEntry[]
  onOpenNote: (entry: VaultEntry) => void
  onToggleFavorite?: (path: string) => void
  onArchive?: (path: string) => void
  locale?: AppLocale
}

interface VisibleFilter {
  types: Set<string>
  showFavoritesOnly: boolean
  showArchived: boolean
}

export function GraphView({ entries, onOpenNote, onToggleFavorite, onArchive, locale = 'en' }: GraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const fgRef = useRef<GraphInstance | null>(null)
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [collapsedTypes, setCollapsedTypes] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [includeIndex, setIncludeIndex] = useState(false)
  const [filter, setFilter] = useState<VisibleFilter>({
    types: new Set(),
    showFavoritesOnly: false,
    showArchived: false,
  })
  const [contextMenuNode, setContextMenuNode] = useState<GraphNode | null>(null)
  const t = useCallback((key: Parameters<typeof translate>[1]) => translate(locale, key), [locale])

  const baseGraph = useMemo(
    () => entriesToGraph(entries, { includeIndex }),
    [entries, includeIndex],
  )

  const allTypes = useMemo(() => {
    const types = new Set<string>()
    for (const node of baseGraph.nodes) {
      if (node.entry.isA) types.add(node.entry.isA)
    }
    return Array.from(types).sort()
  }, [baseGraph.nodes])

  const adjacency = useMemo(() => buildAdjacency(baseGraph.links), [baseGraph.links])

  /** Apply Phase-2 filters + Phase-3 type aggregation to produce the renderable graph. */
  const renderedGraph = useMemo(() => {
    const visibleNodes = baseGraph.nodes.filter((node) => {
      const e = node.entry
      if (filter.showFavoritesOnly && !e.favorite) return false
      if (!filter.showArchived && e.archived) return false
      if (filter.types.size > 0 && !filter.types.has(e.isA ?? '')) return false
      return true
    })

    const { nodes: aggregatedNodes } = collapseNodesByType(visibleNodes, collapsedTypes)
    const nodeIdSet = new Set(aggregatedNodes.map((n) => n.id))
    const visibleLinks = baseGraph.links.filter(
      (l) => nodeIdSet.has(l.source) && nodeIdSet.has(l.target),
    )
    return { nodes: aggregatedNodes, links: visibleLinks }
  }, [baseGraph, filter, collapsedTypes])

  // --- hover neighborhood highlight (Phase 2) ---
  const highlightedNodeIds = useMemo(() => {
    if (!hoveredNode) return null
    const neighbors = adjacency.get(hoveredNode.id)
    const ids = new Set<string>([hoveredNode.id])
    neighbors?.forEach((n) => ids.add(n))
    return ids
  }, [hoveredNode, adjacency])

  // --- search focus (Phase 2) ---
  useEffect(() => {
    if (!search.trim() || !fgRef.current) return
    const needle = search.toLowerCase()
    const match = baseGraph.nodes.find(
      (n) =>
        n.label.toLowerCase().includes(needle) ||
        n.entry.filename.toLowerCase().includes(needle),
    )
    if (!match) return
    // The instance has simulated positions; find the live node with coords.
    const liveNodes = fgRef.current.graphData().nodes as Array<NodeObject & { id?: string }>
    const live = liveNodes.find((n) => n.id === match.id)
    if (live && typeof live.x === 'number' && typeof live.y === 'number') {
      fgRef.current.centerAt(live.x, live.y, 400)
      fgRef.current.zoom(2, 400)
    }
  }, [search, baseGraph.nodes])

  // --- init force-graph instance ---
  useEffect(() => {
    if (!containerRef.current) return
    const fg = buildGraphInstance(containerRef.current)
      .nodeId('id')
      .nodeLabel((node: NodeObject) => asGraphNode(node).label)
      .nodeColor((node: NodeObject) => {
        const n = asGraphNode(node)
        if (!highlightedNodeIds) return n.color
        return highlightedNodeIds.has(n.id) ? n.color : `${n.color}55`
      })
      .linkColor((link) => {
        if (!highlightedNodeIds) return 'rgba(120,120,140,0.25)'
        const sourceNode = typeof link.source === 'object' ? link.source : undefined
        const targetNode = typeof link.target === 'object' ? link.target : undefined
        if (!sourceNode || !targetNode) return 'rgba(120,120,140,0.05)'
        const s = asGraphNode(sourceNode)
        const t = asGraphNode(targetNode)
        if (highlightedNodeIds.has(s.id) && highlightedNodeIds.has(t.id)) {
          return 'rgba(120,160,255,0.7)'
        }
        return 'rgba(120,120,140,0.05)'
      })
      .nodeCanvasObject((node: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const n = asGraphNode(node)
        const fontSize = Math.max(10 / globalScale, 4)
        ctx.font = `${fontSize}px sans-serif`
        const textWidth = ctx.measureText(n.label).width
        const r = Math.max(textWidth / 2 + 4 / globalScale, 5)
        ctx.beginPath()
        ctx.arc(node.x ?? 0, node.y ?? 0, r, 0, 2 * Math.PI)
        ctx.fillStyle = n.color
        ctx.fill()
        if (globalScale >= 2) {
          ctx.fillStyle = '#fff'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(n.label, node.x ?? 0, node.y ?? 0)
        }
      })
      .onNodeHover((node: NodeObject | null) => {
        setHoveredNode(node ? asGraphNode(node) : null)
      })
      .onNodeClick((node: NodeObject) => {
        const n = asGraphNode(node)
        if (n.id.startsWith('__type__')) {
          const type = n.id.replace('__type__', '')
          setCollapsedTypes((prev) => {
            const next = new Set(prev)
            if (next.has(type)) next.delete(type)
            else next.add(type)
            return next
          })
        } else {
          onOpenNote(n.entry)
        }
      })
      .onNodeRightClick((node: NodeObject) => {
        const n = asGraphNode(node)
        if (n.id.startsWith('__type__')) return
        setContextMenuNode(n)
      })
    fgRef.current = fg
    // Expose a test hook to programmatically simulate a node click (used by
    // Playwright smoke tests where canvas-coordinate clicks are unreliable).
    if (typeof window !== 'undefined') {
      ;(window as unknown as { __graphViewTestClickNode?: (id?: string) => void }).__graphViewTestClickNode = (id?: string) => {
        const nodes = fg.graphData().nodes as Array<NodeObject & { id?: string }>
        const target = id ? nodes.find((n) => n.id === id) : nodes[0]
        if (target) {
          const n = asGraphNode(target)
          if (!n.id.startsWith('__type__')) onOpenNote(n.entry)
        }
      }
    }
    return () => {
      fg._destructor()
      fgRef.current = null
    }
  }, [highlightedNodeIds, onOpenNote])

  // --- feed data into the instance when renderedGraph changes ---
  useEffect(() => {
    fgRef.current?.graphData(renderedGraph as GraphData)
  }, [renderedGraph])

  // --- resize observer ---
  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(() => {
      const el = containerRef.current
      if (!el || !fgRef.current) return
      fgRef.current.width(el.clientWidth)
      fgRef.current.height(el.clientHeight)
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const toggleTypeFilter = useCallback((type: string) => {
    setFilter((prev) => {
      const types = new Set(prev.types)
      if (types.has(type)) types.delete(type)
      else types.add(type)
      return { ...prev, types }
    })
  }, [])

  const toggleCollapseType = useCallback((type: string) => {
    setCollapsedTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }, [])

  return (
    <div className="flex h-full flex-col overflow-hidden border-r border-[var(--sidebar-border)] bg-background">
      {/* toolbar */}
      <div className="flex items-center gap-2 border-b border-[var(--sidebar-border)] px-3 py-2">
        <div className="relative flex-1">
          <MagnifyingGlass className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('graph.searchPlaceholder')}
            className="h-8 pl-7 pr-7 text-xs"
          />
          {search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setSearch('')}
              aria-label={t('graph.clearSearch')}
            >
              <X size={14} />
            </Button>
          )}
        </div>
        <Button
          variant={showFilters ? 'default' : 'ghost'}
          size="sm"
          className="h-8 px-2"
          onClick={() => setShowFilters((s) => !s)}
          title={t('graph.filters')}
          aria-label={t('graph.filters')}
        >
          <Funnel size={14} />
        </Button>
      </div>

      {/* filter panel (Phase 2) */}
      {showFilters && (
        <div className="border-b border-[var(--sidebar-border)] bg-[var(--surface-sidebar)] px-3 py-2 text-xs">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-medium">{t('graph.types')}</span>
          </div>
          <div className="mb-2 flex max-h-32 flex-wrap gap-1 overflow-y-auto">
            {allTypes.map((type) => (
              <div key={type} className="flex items-center gap-1">
                <Button
                  variant={filter.types.has(type) ? 'default' : 'outline'}
                  size="sm"
                  className="h-6 px-2 text-[11px]"
                  onClick={() => toggleTypeFilter(type)}
                >
                  {type}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1 text-[11px]"
                  onClick={() => toggleCollapseType(type)}
                  title={collapsedTypes.has(type) ? t('graph.expand') : t('graph.collapse')}
                >
                  {collapsedTypes.has(type) ? t('graph.expand') : t('graph.collapse')}
                </Button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5">
              <Switch
                checked={filter.showFavoritesOnly}
                onCheckedChange={(v) => setFilter((p) => ({ ...p, showFavoritesOnly: v }))}
              />
              <Star size={12} /> {t('graph.favoritesOnly')}
            </label>
            <label className="flex items-center gap-1.5">
              <Switch
                checked={filter.showArchived}
                onCheckedChange={(v) => setFilter((p) => ({ ...p, showArchived: v }))}
              />
              <Archive size={12} /> {t('graph.showArchived')}
            </label>
            <label className="flex items-center gap-1.5">
              <Switch checked={includeIndex} onCheckedChange={setIncludeIndex} />
              {t('graph.showIndex')}
            </label>
          </div>
        </div>
      )}

      {/* canvas */}
      <div ref={containerRef} data-testid="graph-canvas" className="relative flex-1" />

      {/* node count + hover info */}
      <div data-testid="graph-footer" className="flex items-center justify-between border-t border-[var(--sidebar-border)] px-3 py-1 text-[11px] text-muted-foreground">
        <span>
          {renderedGraph.nodes.length} {t('graph.nodes')} · {renderedGraph.links.length} {t('graph.links')}
        </span>
        {hoveredNode && <span className="truncate">{hoveredNode.label}</span>}
      </div>

      {/* context menu (Phase 2) — right-click actions. The trigger is invisible
          because the menu is opened programmatically via contextMenuNode state. */}
      <DropdownMenu open={!!contextMenuNode} onOpenChange={(o) => !o && setContextMenuNode(null)}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="pointer-events-none absolute h-0 w-0 opacity-0" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            onClick={() => {
              if (contextMenuNode) onOpenNote(contextMenuNode.entry)
              setContextMenuNode(null)
            }}
          >
            <FolderOpen size={14} className="mr-2" /> {t('graph.open')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              if (contextMenuNode && onToggleFavorite) onToggleFavorite(contextMenuNode.entry.path)
              setContextMenuNode(null)
            }}
          >
            <Star size={14} className="mr-2" /> {t('graph.favorite')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              if (contextMenuNode && onArchive) onArchive(contextMenuNode.entry.path)
              setContextMenuNode(null)
            }}
          >
            <Archive size={14} className="mr-2" /> {t('graph.archive')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
