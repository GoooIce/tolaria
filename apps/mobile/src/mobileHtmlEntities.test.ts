import { describe, expect, it } from 'vitest'
import { decodeMobileHtmlEntities } from './mobileHtmlEntities'

describe('decodeMobileHtmlEntities', () => {
  it('decodes common named, decimal, hexadecimal, and spacing entities', () => {
    expect(
      decodeMobileHtmlEntities({
        text: 'A&nbsp;B &lt;C&gt; &#33; &#x3f; &amp;',
      }),
    ).toBe('A B <C> ! ? &')
  })
})
