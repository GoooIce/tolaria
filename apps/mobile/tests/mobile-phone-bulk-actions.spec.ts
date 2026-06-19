import { expect, test, type Page } from '@playwright/test'

test.describe('phone bulk note action parity', () => {
  test('applies phone note-list bulk actions', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'phone-portrait', 'Phone bulk actions run on the phone note list.')

    await page.goto('/')
    await bulkSelectDefaultNotes(page)
    await expect(page.getByTestId('note-list-bulk-selected-count')).toHaveText('2 selected')
    await page.getByTestId('note-list-bulk-clear').click()
    await expect(page.getByTestId('note-list-bulk-action-bar')).toBeHidden()
    await expect(page.getByTestId('note-row-workflow-orchestration')).toBeVisible()

    await bulkSelectDefaultNotes(page)
    await page.getByTestId('note-list-bulk-archive').click()
    await expect(page.getByTestId('note-row-workflow-orchestration')).toBeHidden()
    await expect(page.getByTestId('note-row-open-source-project')).toBeHidden()

    await openPhoneSidebar(page)
    await page.getByTestId('sidebar-item-archive').click()
    await expect(page.getByTestId('note-list-toolbar-title')).toHaveText('Archive')
    await expect(page.getByTestId('note-row-workflow-orchestration')).toBeVisible()
    await bulkSelectDefaultNotes(page)
    await page.getByTestId('note-list-bulk-archive').click()
    await expect(page.getByTestId('note-row-workflow-orchestration')).toBeHidden()

    await openPhoneSidebar(page)
    await page.getByTestId('sidebar-item-inbox').click()
    await expect(page.getByTestId('note-row-workflow-orchestration')).toBeVisible()
    await bulkSelectDefaultNotes(page)
    await page.getByTestId('note-list-bulk-organize').click()
    await expect(page.getByTestId('note-row-workflow-orchestration')).toBeHidden()
    await expect(page.getByTestId('note-row-open-source-project')).toBeHidden()

    await openPhoneSidebar(page)
    await page.getByTestId('sidebar-item-all-notes').click()
    await expect(page.getByTestId('note-row-workflow-orchestration')).toBeVisible()
    await bulkSelectDefaultNotes(page)
    await page.getByTestId('note-list-bulk-delete').click()
    await expect(page.getByTestId('note-row-workflow-orchestration')).toBeHidden()
    await expect(page.getByTestId('note-row-open-source-project')).toBeHidden()
  })
})

async function bulkSelectDefaultNotes(page: Page) {
  await longPress(page, 'note-row-workflow-orchestration')
  await page.getByTestId('note-row-open-source-project').click()
  await expect(page.getByTestId('note-list-bulk-action-bar')).toBeVisible()
}

async function openPhoneSidebar(page: Page) {
  if (await page.getByTestId('phone-sidebar-screen').isVisible()) return

  await page.getByTestId('phone-sidebar-action').click()
  await expect(page.getByTestId('phone-sidebar-screen')).toBeVisible()
}

async function longPress(page: Page, testId: string) {
  const target = page.getByTestId(testId)
  const box = await target.boundingBox()
  if (!box) throw new Error(`Cannot long-press missing target: ${testId}`)

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.waitForTimeout(700)
  await page.mouse.up()
}
