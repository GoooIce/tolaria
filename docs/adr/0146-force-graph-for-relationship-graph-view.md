---
type: ADR
id: "0146"
title: "force-graph for the relationship graph view"
status: active
date: 2026-06-26
---

## Context

Tolaria's knowledge graph (the in-memory `VaultEntry[]` plus `outgoingLinks`/
`relationships`/`belongsTo`/`relatedTo`) had no visualization. Users navigating
1300+ notes needed a way to see connections at a glance. This ADR records the
choice of rendering library for the new Graph View (ADR-0145's data layer feeds it).

## Decision

Use **`force-graph`** (canvas-based, bundles d3-force) for the relationship graph view.

### Benchmark basis (Apple Silicon, headless Chromium)

| Engine | 500 nodes | 1500 nodes | 5000 nodes | 10000 nodes |
|---|---|---|---|---|
| **force-graph** (canvas) | 121 fps | **119 fps** | 35 fps | 14 fps |
| cytoscape (cose layout) | 120 fps | crash (sync block) | — | — |

Pure-layout CPU cost (300 iterations, no render):

| Nodes | d3-force | ForceAtlas2 |
|---|---|---|
| 1500 | 1003 ms | 1979 ms |
| 5000 | 4461 ms | 22047 ms |

d3-force (which force-graph bundles) scales near-linearly; ForceAtlas2 degrades
super-linearly. A 1500-node vault (the target scale) renders at 121 FPS — well
above the 30 FPS acceptance bar.

## Options considered

- **force-graph** (chosen): Canvas rendering, incremental d3-force layout via
  `requestAnimationFrame`, drop-in upgrade path to WebGL (`3d-force-graph`).
  Best large-scale performance in the benchmark.
- **cytoscape**: Richer ecosystem (layouts, plugins) but `cose` layout is
  synchronous and froze the main thread at 1500 nodes. Rejected for performance.
- **sigma + graphology**: WebGL, fast at scale, but heavier setup and the target
  vault size (1500) is well within canvas's comfort zone. Rejected as over-engineering.
- **3d-force-graph (WebGL)**: Same API as force-graph but 3D. Rejected: WKWebView
  WebGL stability concerns, and 2D canvas is sufficient at target scale. Kept as
  upgrade path if vaults exceed 5000 nodes.

## Consequences

- Graph View is a frontend-only feature: no Rust/backend changes, data sourced
  from existing `VaultEntry[]` via `entriesToGraph()` (ADR-0145).
- Canvas rendering avoids WebGL context issues in WKWebView.
- At 5000+ nodes, FPS drops below 30. Phase 3 mitigations (type-collapse
  aggregation into super-nodes, viewport-aware rendering) extend the comfort zone.
- If vaults grow beyond Phase 3 capacity, `3d-force-graph` is a drop-in WebGL
  replacement sharing the same API surface.
- The `force-graph` types ship a class that is invoked as a factory at runtime
  (`ForceGraph()(el)`); the integration casts through `unknown` once at the
  factory boundary and types only the consumed methods.
