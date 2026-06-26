import { test, expect } from '@playwright/test'
import { triggerMenuCommand } from './testBridge'
import {
  createFixtureVaultCopy,
  openFixtureVaultDesktopHarness,
  removeFixtureVaultCopy,
} from '../helpers/fixtureVault'

/**
 * Graph view smoke tests — Phase 1 acceptance.
 *
 * Uses the fixture-vault desktop harness so the vault loads with real entries
 * before opening the graph.
 */
test.describe('Graph view @smoke', () => {
  let tempVaultDir: string

  test.beforeEach(async ({ page }, testInfo) => {
    testInfo.setTimeout(60_000)
    tempVaultDir = createFixtureVaultCopy()
    await openFixtureVaultDesktopHarness(page, tempVaultDir)
    await page.setViewportSize({ width: 1600, height: 900 })
  })

  test.afterEach(() => {
    removeFixtureVaultCopy(tempVaultDir)
  })

  test('graph view renders canvas with node/link counts', async ({ page }) => {
    await triggerMenuCommand(page, 'go-graph')

    // GraphView mounts a force-graph canvas inside the graph-canvas container
    const graphCanvas = page.getByTestId('graph-canvas')
    await expect(graphCanvas).toBeVisible({ timeout: 10_000 })
    await expect(graphCanvas.locator('canvas')).toHaveCount(1, { timeout: 5_000 })

    // Footer shows node + link counts
    const footer = page.getByTestId('graph-footer')
    await expect(footer).toContainText(/nodes/, { timeout: 5_000 })
    await expect(footer).toContainText(/links/, { timeout: 5_000 })
  })

  test('search box is present and accepts input', async ({ page }) => {
    await triggerMenuCommand(page, 'go-graph')

    const search = page.locator('.app__note-list input[placeholder*="Search"]')
    await expect(search).toBeVisible({ timeout: 10_000 })
    await search.click()
    await search.fill('project')
    await expect(search).toHaveValue('project')
  })

  test('filter funnel button toggles the filter panel', async ({ page }) => {
    await triggerMenuCommand(page, 'go-graph')
    await expect(page.getByTestId('graph-canvas')).toBeVisible({ timeout: 10_000 })

    const noteList = page.locator('.app__note-list')
    const funnelButton = noteList.getByRole('button', { name: /Filters/i })
    await funnelButton.click()

    await expect(noteList.getByText(/Favorites/)).toBeVisible({ timeout: 5_000 })
  })

  test('clicking a node opens the note in the editor', async ({ page }) => {
    await triggerMenuCommand(page, 'go-graph')
    const graphCanvas = page.getByTestId('graph-canvas')
    await expect(graphCanvas).toBeVisible({ timeout: 10_000 })
    await expect(graphCanvas.locator('canvas')).toHaveCount(1, { timeout: 5_000 })

    // Wait for the force-graph instance to initialize with data.
    await page.waitForTimeout(2000)

    // Programmatically trigger a node click via the test hook (canvas
    // coordinate clicks are unreliable across viewport sizes).
    await page.evaluate(() => {
      const hook = (window as unknown as { __graphViewTestClickNode?: (id?: string) => void }).__graphViewTestClickNode
      if (hook) hook()
    })

    // After clicking a node, the editor pane shows the opened note's content.
    const editor = page.locator('.app__editor')
    await expect(editor).toBeVisible({ timeout: 10_000 })
    await expect(editor.locator('.bn-editor').first()).toBeVisible({ timeout: 10_000 })
  })
})
