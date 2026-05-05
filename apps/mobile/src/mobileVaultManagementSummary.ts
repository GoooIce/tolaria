import { parseMobileGitRemote } from './mobileGitRemote'
import type { MobileVaultMetadata } from './mobileVaultMetadata'

export type MobileVaultManagementSummary = {
  actionLabel: string
  name: string
  remoteDetail: string
  remoteLabel: string
  storageLabel: string
}

export function createMobileVaultManagementSummary(vault: MobileVaultMetadata): MobileVaultManagementSummary {
  const remoteUrl = vault.remoteUrl?.trim()

  return {
    actionLabel: remoteUrl ? 'Change remote' : 'Add Git remote',
    name: vault.name,
    remoteDetail: remoteDetail(remoteUrl),
    remoteLabel: remoteUrl ? 'Git sync' : 'Local only',
    storageLabel: 'App-local Markdown vault',
  }
}

function remoteDetail(remoteUrl: string | undefined) {
  if (!remoteUrl) {
    return 'Stored on this device'
  }

  const remote = parseMobileGitRemote(remoteUrl)
  return remote ? `${remote.host}/${remote.owner}/${remote.repository}` : 'Remote needs review'
}
