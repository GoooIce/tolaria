export function decodeMobileHtmlEntities(input: { text: string }) {
  return input.text
    .replace(/&#x([0-9a-f]+);/gi, (_, value: string) => numericEntity({ radix: 16, value }))
    .replace(/&#([0-9]+);/g, (_, value: string) => numericEntity({ radix: 10, value }))
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
}

function numericEntity(input: { radix: number; value: string }) {
  const codePoint = Number.parseInt(input.value, input.radix)
  if (!Number.isFinite(codePoint)) {
    return input.value
  }

  try {
    return String.fromCodePoint(codePoint)
  } catch {
    return input.value
  }
}
