import { createNativeMobileGitHubOAuthSession } from './mobileNativeGitHubOAuthSession'
import {
  mobileGitHubOAuthClientIdState,
  type MobileGitHubOAuthClientIdState,
} from './mobileGitHubOAuthClientId'
import type { MobileGitHubOAuthSession } from './mobileGitHubOAuthFlow'

declare const process: { env?: Record<string, string | undefined> } | undefined

export function createNativeMobileGitHubOAuthSessionFromEnvironment(): MobileGitHubOAuthSession {
  const clientIdState = currentMobileGitHubOAuthClientIdState()
  if (clientIdState.state === 'missing') {
    return {
      authorize: async () => ({
        message: 'GitHub OAuth client ID is not configured.',
        state: 'failed',
      }),
    }
  }

  return createNativeMobileGitHubOAuthSession({ clientId: clientIdState.clientId })
}

export function currentMobileGitHubOAuthClientIdState(): MobileGitHubOAuthClientIdState {
  return mobileGitHubOAuthClientIdState(process?.env)
}
