import { describe, expect, it } from 'vitest'
import { mobileGitHubOAuthClientIdState } from './mobileGitHubOAuthClientId'

describe('mobileGitHubOAuthClientIdState', () => {
  it('detects a configured Expo public GitHub OAuth client id', () => {
    expect(mobileGitHubOAuthClientIdState({
      EXPO_PUBLIC_GITHUB_OAUTH_CLIENT_ID: ' abc123 ',
    })).toEqual({
      clientId: 'abc123',
      state: 'configured',
    })
  })

  it('reports a missing client id when the env value is absent or blank', () => {
    expect(mobileGitHubOAuthClientIdState({})).toEqual({ state: 'missing' })
    expect(mobileGitHubOAuthClientIdState({
      EXPO_PUBLIC_GITHUB_OAUTH_CLIENT_ID: ' ',
    })).toEqual({ state: 'missing' })
  })
})
