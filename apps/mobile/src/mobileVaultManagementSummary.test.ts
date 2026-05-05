import { describe, expect, it } from 'vitest'
import { createMobileVaultManagementSummary } from './mobileVaultManagementSummary'

describe('mobile vault management summary', () => {
  it('summarizes a local-only vault', () => {
    expect(createMobileVaultManagementSummary({ id: 'personal', name: 'Personal Journal' })).toEqual({
      actionLabel: 'Add Git remote',
      name: 'Personal Journal',
      remoteDetail: 'Stored on this device',
      remoteLabel: 'Local only',
      storageLabel: 'App-local Markdown vault',
    })
  })

  it('summarizes a remote-backed vault without exposing credentials', () => {
    expect(createMobileVaultManagementSummary({
      id: 'work',
      name: 'Work',
      remoteUrl: 'git@github.com:refactoringhq/tolaria.git',
    })).toMatchObject({
      actionLabel: 'Change remote',
      remoteDetail: 'github.com/refactoringhq/tolaria',
      remoteLabel: 'Git sync',
    })
  })

  it('flags invalid persisted remote metadata for repair', () => {
    expect(createMobileVaultManagementSummary({
      id: 'broken',
      name: 'Broken',
      remoteUrl: '/Users/luca/Laputa',
    }).remoteDetail).toBe('Remote needs review')
  })
})
