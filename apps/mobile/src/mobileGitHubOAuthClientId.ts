export type MobileGitHubOAuthClientIdState =
  | {
      clientId: string
      state: 'configured'
    }
  | {
      state: 'missing'
    }

export function mobileGitHubOAuthClientIdState(
  env: Record<string, string | undefined> | undefined,
): MobileGitHubOAuthClientIdState {
  const clientId = env?.EXPO_PUBLIC_GITHUB_OAUTH_CLIENT_ID?.trim()
  return clientId ? { clientId, state: 'configured' } : { state: 'missing' }
}
