export type NativeLayoutMetric = {
  height: number
  id: string
  platform: string
  width: number
  x: number
  y: number
}

export type NativeLayoutMetricMap = Record<string, NativeLayoutMetric>

export type NativeLayoutAssertionFailure = {
  actual: number | null
  expected: number
  id: string
  message: string
}

type SidebarPadding = {
  bottom: number
  left: number
  right: number
  top: number
}

const metricPrefix = 'TOLARIA_MOBILE_LAYOUT_METRIC'
const layoutTolerance = 1.5
export const nativeSidebarMetricContract = {
  folderRowContentInset: 12,
  folderRowIndent: 25,
  itemPadding: {
    regular: { bottom: 6, left: 12, right: 16, top: 6 },
    withCount: { bottom: 6, left: 12, right: 8, top: 6 },
  },
  sectionHorizontalPadding: 6,
  sectionTitleMinHeight: 30,
} as const

export function parseNativeLayoutMetrics(logText: string): NativeLayoutMetric[] {
  const metrics: NativeLayoutMetric[] = []

  for (const line of logText.split('\n')) {
    const prefixIndex = line.indexOf(metricPrefix)
    if (prefixIndex === -1) continue

    const rawJson = line.slice(prefixIndex + metricPrefix.length).trim()
    const metric = parseMetric(rawJson)
    if (metric) metrics.push(metric)
  }

  return metrics
}

export function latestNativeLayoutMetrics(metrics: NativeLayoutMetric[]): NativeLayoutMetricMap {
  return Object.fromEntries(metrics.map((metric) => [metric.id, metric]))
}

export function assertNativeSidebarLayoutMetrics(metrics: NativeLayoutMetricMap): NativeLayoutAssertionFailure[] {
  return [
    ...assertSidebarItemLayout(metrics, 'sidebar.item.inbox', nativeSidebarMetricContract.itemPadding.withCount),
    ...assertSidebarItemLayout(metrics, 'sidebar.item.all-notes', nativeSidebarMetricContract.itemPadding.withCount),
    ...assertSidebarItemLayout(metrics, 'sidebar.item.personal-journal', nativeSidebarMetricContract.itemPadding.regular),
    ...assertSidebarItemLayout(metrics, 'sidebar.item.essays', nativeSidebarMetricContract.itemPadding.withCount),
    ...assertStackedRows(metrics, ['sidebar.item.inbox', 'sidebar.item.all-notes', 'sidebar.item.archive']),
    ...assertSectionTitleLayout(metrics, 'favorites', 'sidebar.item.personal-journal.row'),
    ...assertSectionTitleLayout(metrics, 'types', 'sidebar.item.essays.row'),
    ...assertSectionTitleLayout(metrics, 'folders', 'sidebar.folderTree.root'),
    ...assertFolderLayout(metrics, 'sidebar.folder.writing', nativeSidebarMetricContract.folderRowContentInset),
    ...assertFolderLayout(
      metrics,
      'sidebar.folder.tolaria-mobile',
      nativeSidebarMetricContract.folderRowContentInset + nativeSidebarMetricContract.folderRowIndent,
    ),
  ]
}

function assertStackedRows(metrics: NativeLayoutMetricMap, ids: string[]): NativeLayoutAssertionFailure[] {
  return ids.slice(1).flatMap((id, index) => {
    const previous = metrics[`${ids[index]}.row`]
    const current = metrics[`${id}.row`]

    return [
      ...expectMetric(previous, ids[index], 'previous row is captured before checking sidebar row stacking'),
      ...expectMetric(current, id, 'row is captured before checking sidebar row stacking'),
      ...expectAtLeast(
        previous && current ? current.y - previous.y - previous.height : null,
        0,
        id,
        'row starts after the previous sidebar row',
      ),
    ]
  })
}

function assertSectionTitleLayout(
  metrics: NativeLayoutMetricMap,
  sectionId: string,
  firstContentMetricId: string,
): NativeLayoutAssertionFailure[] {
  const id = `sidebar.section.${sectionId}`
  const titleRow = metrics[`${id}.row`]
  const firstContent = metrics[firstContentMetricId]

  return [
    ...expectMetric(titleRow, id, 'section title row is captured before checking native sidebar spacing'),
    ...expectMetric(firstContent, firstContentMetricId, 'first section content is captured before checking native sidebar spacing'),
    ...expectClose(titleRow?.x ?? null, nativeSidebarMetricContract.sectionHorizontalPadding, id, 'section title keeps desktop section inset'),
    ...expectAtLeast(titleRow?.height ?? null, nativeSidebarMetricContract.sectionTitleMinHeight, id, 'section title keeps desktop header height'),
    ...expectAtLeast(
      titleRow && firstContent ? firstContent.y - titleRow.y - titleRow.height : null,
      0,
      firstContentMetricId,
      'first row starts after the sidebar section title',
    ),
  ]
}

export function formatNativeLayoutAssertionFailures(failures: NativeLayoutAssertionFailure[]) {
  return failures
    .map((failure) => {
      const actual = failure.actual === null ? 'missing' : failure.actual.toFixed(1)
      return `${failure.id}: ${failure.message}; expected ${failure.expected.toFixed(1)}, got ${actual}`
    })
    .join('\n')
}

function assertSidebarItemLayout(
  metrics: NativeLayoutMetricMap,
  id: string,
  padding: SidebarPadding,
): NativeLayoutAssertionFailure[] {
  const row = metrics[`${id}.row`]
  const content = metrics[`${id}.content`]

  return [
    ...expectMetric(row, id, 'row is captured before checking native padding'),
    ...expectMetric(content, id, 'content is captured before checking native padding'),
    ...expectClose(row?.x ?? null, nativeSidebarMetricContract.sectionHorizontalPadding, id, 'row keeps desktop section inset'),
    ...expectClose(content?.x ?? null, padding.left, id, 'content keeps desktop left padding'),
    ...expectClose(
      row && content ? row.width - content.x - content.width : null,
      padding.right,
      id,
      'content keeps desktop right padding',
    ),
    ...expectClose(
      row && content ? row.height - content.height : null,
      padding.top + padding.bottom,
      id,
      'row keeps desktop vertical padding',
    ),
  ]
}

function assertFolderLayout(
  metrics: NativeLayoutMetricMap,
  id: string,
  expectedLeftInset: number,
): NativeLayoutAssertionFailure[] {
  const row = metrics[`${id}.row`]
  const content = metrics[`${id}.content`]

  return [
    ...expectMetric(row, id, 'row is captured before checking native folder layout'),
    ...expectMetric(content, id, 'content is captured before checking native folder layout'),
    ...expectClose(content?.x ?? null, expectedLeftInset, id, 'folder content keeps desktop indentation'),
    ...expectAtLeast(row?.height ?? null, 28, id, 'folder row keeps a tappable hit area'),
  ]
}

function expectMetric(
  metric: NativeLayoutMetric | undefined,
  id: string,
  message: string,
): NativeLayoutAssertionFailure[] {
  if (metric) return []

  return [{ actual: null, expected: 1, id, message }]
}

function expectClose(
  actual: number | null,
  expected: number,
  id: string,
  message: string,
): NativeLayoutAssertionFailure[] {
  if (actual !== null && Math.abs(actual - expected) <= layoutTolerance) return []

  return [{ actual, expected, id, message }]
}

function expectAtLeast(
  actual: number | null,
  expected: number,
  id: string,
  message: string,
): NativeLayoutAssertionFailure[] {
  if (actual !== null && actual >= expected) return []

  return [{ actual, expected, id, message }]
}

function parseMetric(rawJson: string): NativeLayoutMetric | null {
  try {
    const value: unknown = JSON.parse(rawJson)
    return nativeLayoutMetricFromJson(value)
  } catch {
    return null
  }
}

function nativeLayoutMetricFromJson(value: unknown): NativeLayoutMetric | null {
  if (!isRecord(value)) return null

  const id = stringValue(value.id)
  const platform = stringValue(value.platform)
  const height = numberValue(value.height)
  const width = numberValue(value.width)
  const x = numberValue(value.x)
  const y = numberValue(value.y)
  if (!id || !platform || height === null || width === null || x === null || y === null) return null

  return { height, id, platform, width, x, y }
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' ? value : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
