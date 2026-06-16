type MarkdownCodeFenceMarker = 'backtick' | 'tilde'

export type MobileMarkdownCodeFence = {
  info: string | null
  marker: string
  markerKind: MarkdownCodeFenceMarker
}

export function readMobileMarkdownCodeFence(line: string): MobileMarkdownCodeFence | null {
  const trimmed = line.trim()
  const markerKind = readFenceMarkerKind(trimmed)
  if (!markerKind) return null

  const marker = readFenceMarker(trimmed, markerKind)
  if (!marker) return null

  const info = trimmed.slice(marker.length).trim()
  return {
    info: info || null,
    marker,
    markerKind,
  }
}

export function isMobileMarkdownCodeFenceClose(
  line: string,
  opening: MobileMarkdownCodeFence,
): boolean {
  const trimmed = line.trim()
  const marker = readFenceMarker(trimmed, opening.markerKind)
  return Boolean(
    marker
    && marker.length >= opening.marker.length
    && trimmed.slice(marker.length).trim() === '',
  )
}

function readFenceMarkerKind(line: string): MarkdownCodeFenceMarker | null {
  if (line.startsWith('```')) return 'backtick'
  if (line.startsWith('~~~')) return 'tilde'
  return null
}

function readFenceMarker(line: string, markerKind: MarkdownCodeFenceMarker): string | null {
  const match = markerKind === 'backtick' ? line.match(/^`{3,}/) : line.match(/^~{3,}/)
  return match?.[0] ?? null
}
