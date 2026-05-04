import { describe, expect, it } from 'vitest'
import { createMobileVaultConfig } from './mobileVaultConfig'

describe('mobile vault config', () => {
  it('creates an app-local vault without sync when no remote is provided', () => {
    expect(createMobileVaultConfig({ id: 'personal', name: 'Personal Journal' })).toEqual({
      ok: true,
      config: {
        id: 'personal',
        name: 'Personal Journal',
        storage: {
          kind: 'appLocalGit',
          directoryName: 'personal-journal',
        },
        sync: {
          state: 'localOnly',
          remote: null,
          authRequirement: null,
        },
      },
    })
  })

  it('uses GitHub OAuth for GitHub-backed vaults', () => {
    const result = createMobileVaultConfig({
      id: 'tolaria',
      name: 'Tolaria MVP',
      remoteUrl: 'https://github.com/refactoringhq/tolaria.git',
    })

    expect(result).toMatchObject({
      ok: true,
      config: {
        sync: {
          state: 'remoteReady',
          remote: {
            host: 'github.com',
            owner: 'refactoringhq',
            repository: 'tolaria',
          },
          authRequirement: {
            strategy: 'githubOAuth',
            host: 'github.com',
          },
        },
      },
    })
  })

  it('requires SSH keys for arbitrary Git remotes', () => {
    const result = createMobileVaultConfig({
      id: 'work',
      name: 'Work',
      remoteUrl: 'ssh://git@git.example.com/acme/notes.git',
    })

    expect(result).toMatchObject({
      ok: true,
      config: {
        sync: {
          authRequirement: {
            strategy: 'sshKey',
            host: 'git.example.com',
          },
        },
      },
    })
  })

  it('rejects invalid remote URLs before persisting a config', () => {
    expect(
      createMobileVaultConfig({
        id: 'broken',
        name: 'Broken',
        remoteUrl: '/Users/luca/Laputa',
      }),
    ).toEqual({
      ok: false,
      error: 'invalidRemoteUrl',
    })
  })
})
