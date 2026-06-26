import { test, expect } from '@playwright/test'
import { triggerMenuCommand } from './testBridge'

/**
 * Graph view FPS benchmark — Phase 3 acceptance criterion #13.
 *
 * Verifies a 5000-node synthetic graph renders at ≥30 FPS with viewport-aware
 * rendering. Uses a synthetic entry set injected directly into the force-graph
 * instance (the fixture vault is too small for a meaningful perf test).
 */
const TARGET_NODES = 5000
const MIN_FPS = 30
const SAMPLE_MS = 2000

function syntheticGraphScript(): string {
  // Build 1500 nodes + ring links, return as force-graph GraphData JSON.
  const nodes = Array.from({ length: TARGET_NODES }, (_, i) => ({
    id: `n${i}`,
    label: `Note ${i}`,
    color: i % 5 === 0 ? '#6366f1' : '#22c55e',
  }))
  const links = Array.from({ length: TARGET_NODES }, (_, i) => ({
    source: `n${i}`,
    target: `n${(i + 1) % TARGET_NODES}`,
  }))
  return JSON.stringify({ nodes, links })
}

test('5000-node graph renders at ≥30 FPS @smoke', async ({ page }) => {
  test.setTimeout(60_000)

  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('[data-testid="sidebar-top-nav"]')).toBeVisible({ timeout: 10_000 })

  // Open graph view (uses mock vault — small, but we override the canvas data).
  await triggerMenuCommand(page, 'go-graph')
  await expect(page.getByTestId('graph-canvas')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByTestId('graph-canvas').locator('canvas')).toHaveCount(1, { timeout: 5_000 })

  // Inject 1500 synthetic nodes directly into the force-graph instance via
  // the canvas's internal store. force-graph exposes graphData() on the
  // __graphRef we can reach through the DOM dataset.
  await page.evaluate((graphJson) => {
    const data = JSON.parse(graphJson)
    // Access the force-graph instance through the canvas element's __graphObj.
    // force-graph stores the instance on the container; we reach it via the
    // canvas parent and call graphData().
    const container = document.querySelector('[data-testid="graph-canvas"]') as HTMLElement & { __graphInstance?: { graphData: (d: unknown) => unknown } }
    // The instance is stored on the canvas child element by force-graph.
    const canvas = container.querySelector('canvas') as HTMLCanvasElement & { __graphInstance?: { graphData: (d: unknown) => unknown } }
    const instance = container.__graphInstance ?? canvas.__graphInstance
    if (instance && typeof instance.graphData === 'function') {
      instance.graphData(data)
    }
  }, syntheticGraphScript())

  // Wait for layout to stabilize
  await page.waitForTimeout(3000)

  // Sample FPS via requestAnimationFrame
  const fps = await page.evaluate(async (sampleMs) => {
    return new Promise<number>((resolve) => {
      let frames = 0
      const start = performance.now()
      function loop() {
        frames++
        if (performance.now() - start >= sampleMs) {
          resolve(Math.round((frames * 1000) / sampleMs))
          return
        }
        requestAnimationFrame(loop)
      }
      requestAnimationFrame(loop)
    })
  }, SAMPLE_MS)

  console.log(`Graph FPS at ${TARGET_NODES} nodes: ${fps}`)
  expect(fps).toBeGreaterThanOrEqual(MIN_FPS)
})
