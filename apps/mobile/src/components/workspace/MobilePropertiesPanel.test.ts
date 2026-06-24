import { describe, expect, it } from 'vitest'
import {
  mobileInspectorReferenceRowLayoutContract,
  mobileRelationshipValueMetricSegments,
} from './MobilePropertiesPanelModel'
import { desktopPropertyParity, desktopRelationshipParity } from '../../ui/desktopParity'
import type { MobileRelationship } from '../../workspace/mobileWorkspaceModel'

type RelationshipValue = MobileRelationship['values'][number]

describe('mobileRelationshipValueMetricSegments', () => {
  it('keeps reference rows aligned with typed relationship row density', () => {
    expect(mobileInspectorReferenceRowLayoutContract).toEqual({
      iconSize: desktopRelationshipParity.iconSize,
      minHeight: desktopPropertyParity.rowMinHeight,
      paddingHorizontal: desktopRelationshipParity.rowPaddingHorizontal,
      paddingVertical: desktopRelationshipParity.rowPaddingVertical,
      radius: desktopRelationshipParity.rowRadius,
      textFontSize: desktopRelationshipParity.textFontSize,
      textFontWeight: desktopRelationshipParity.textFontWeight,
    })
  })

  it('keeps first relationship row metric ids stable for native layout gates', () => {
    expect(mobileRelationshipValueMetricSegments([
      relationshipValue('LLM Workflow'),
      relationshipValue('Tolaria MVP'),
    ])).toEqual(['llm-workflow', 'tolaria-mvp'])
  })

  it('suffixes only duplicate relationship row ids', () => {
    expect(mobileRelationshipValueMetricSegments([
      relationshipValue('LLM Workflow'),
      relationshipValue('LLM Workflow'),
      relationshipValue('LLM Workflow', '[[Projects/LLM Workflow]]'),
    ])).toEqual([
      'llm-workflow',
      'llm-workflow-2',
      'llm-workflow-3',
    ])
  })
})

function relationshipValue(title: string, ref?: string): RelationshipValue {
  return {
    ref,
    title,
    type: 'Essay',
    typeTone: 'green',
  }
}
