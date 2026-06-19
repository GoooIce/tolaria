import { expect, test, type Page } from '@playwright/test'

test.describe('phone workspace editing parity', () => {
  test('exercises saved-view and type-section editing flows', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'phone-portrait', 'Phone saved-view and type-section checks run on the phone layout.')

    await page.goto('/')
    await createEditAndDeletePhoneSavedView(page)
    await customizePhoneTypeSectionAndCreateTemplateNote(page)
  })
})

async function createEditAndDeletePhoneSavedView(page: Page) {
  await openPhoneSidebar(page)
  await page.getByTestId('sidebar-section-create-views').click()
  await expect(page.getByTestId('workspace-create-view-name-input')).toBeVisible()
  await page.getByTestId('workspace-view-filter-remove-0').click()
  await page.getByTestId('workspace-create-view-name-input').fill('Phone Inbox View')
  await page.getByTestId('workspace-action-sheet-createView').getByRole('button', { exact: true, name: 'Create' }).click()
  await expect(page.getByTestId('workspace-action-sheet')).toBeHidden()
  await openPhoneSidebar(page)
  await expect(page.getByTestId('sidebar-item-view-phone-inbox-view')).toContainText('Phone Inbox View')

  await longPress(page, 'sidebar-item-view-phone-inbox-view')
  await expect(page.getByTestId('workspace-edit-view-name-input')).toHaveValue('Phone Inbox View')
  await page.getByTestId('workspace-edit-view-name-input').fill('Phone Active Work')
  await page.getByTestId('workspace-view-icon-star').click()
  await page.getByTestId('workspace-view-tone-green').click()
  await page.getByTestId('workspace-action-sheet-editView').getByRole('button', { name: 'Save' }).click()
  await expect(page.getByTestId('workspace-action-sheet')).toBeHidden()
  await openPhoneSidebar(page)
  await expect(page.getByTestId('sidebar-item-view-phone-inbox-view')).toContainText('Phone Active Work')

  await page.getByTestId('sidebar-item-view-phone-inbox-view').click()
  await expect(page.getByTestId('phone-note-list-screen')).toBeVisible()
  await expect(page.getByTestId('note-list-toolbar-title')).toHaveText('Phone Active Work')

  await openPhoneSidebar(page)
  await longPress(page, 'sidebar-item-view-phone-inbox-view')
  await page.getByTestId('workspace-delete-view-action').click()
  await expect(page.getByTestId('workspace-action-sheet')).toBeHidden()
  await expect(page.getByTestId('sidebar-item-view-phone-inbox-view')).toBeHidden()
}

async function customizePhoneTypeSectionAndCreateTemplateNote(page: Page) {
  await openPhoneSidebar(page)
  await longPress(page, 'sidebar-item-procedures')
  const sheet = page.getByTestId('workspace-action-sheet-editTypeSection')
  await expect(sheet).toBeVisible()
  await page.getByTestId('workspace-type-section-label-input').fill('Phone Runbooks')
  await page.getByTestId('workspace-type-template-input').fill('## Phone Runbook\n\nPhone type template body.')
  await page.getByTestId('workspace-type-schema-property-name-input').scrollIntoViewIfNeeded()
  await page.getByTestId('workspace-type-schema-property-name-input').fill('Priority')
  await page.getByTestId('workspace-type-schema-property-value-input').fill('High')
  await sheet.getByRole('button', { name: 'Add property' }).click()
  await expect(page.getByTestId('workspace-type-schema-property-priority')).toContainText('High')
  await page.getByTestId('workspace-type-schema-relationship-name-input').fill('belongs_to')
  await page.getByTestId('workspace-type-schema-relationship-target-input').fill('Workflow Orchestration Essay')
  await sheet.getByRole('button', { name: 'Add relationship' }).click()
  await expect(page.getByTestId('workspace-type-schema-relationship-belongs-to')).toContainText('Workflow Orchestration Essay')
  await sheet.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByTestId('workspace-action-sheet')).toBeHidden()
  await expect(page.getByTestId('sidebar-item-procedures')).toContainText('Phone Runbooks')

  await page.getByTestId('sidebar-item-procedures').click()
  await expect(page.getByTestId('phone-note-list-screen')).toBeVisible()
  await expect(page.getByTestId('note-list-toolbar-title')).toHaveText('Phone Runbooks')
  await page.getByTestId('note-list-create-action').click()
  await page.getByTestId('workspace-create-note-title-input').fill('Phone Runbook From Type')
  await page.getByTestId('workspace-action-sheet-createNote').getByRole('button', { exact: true, name: 'Create' }).click()
  await expect(page.getByTestId('note-row-phone-runbook-from-type.md')).toBeVisible()
  await page.getByTestId('note-row-phone-runbook-from-type.md').click()
  await expect(page.getByTestId('phone-editor-screen')).toBeVisible()
  await expect(page.getByTestId('editor-heading-2')).toContainText('Phone Runbook')
  await expect(page.getByTestId('editor-paragraph')).toContainText('Phone type template body.')
  await page.getByTestId('phone-properties-action').click()
  await expect(page.getByTestId('property-row-priority')).toContainText('High')
  await expect(page.getByTestId('relationship-row-workflow-orchestration-essay')).toBeVisible()
}

async function openPhoneSidebar(page: Page) {
  if (await page.getByTestId('phone-sidebar-screen').isVisible()) return

  await page.getByTestId('phone-sidebar-action').click()
  await expect(page.getByTestId('phone-sidebar-screen')).toBeVisible()
}

async function longPress(page: Page, testId: string) {
  await page.getByTestId(testId).click({ delay: 700, force: true })
}
