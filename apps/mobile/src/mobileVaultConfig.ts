import { parseMobileGitRemote, type MobileGitAuthStrategy, type MobileGitRemote } from './mobileGitRemote'

export type MobileVaultStorage = {
  kind: 'appLocalGit'
  directoryName: string
}

export type MobileVaultAuthRequirement = {
  strategy: MobileGitAuthStrategy
  host: string
}

export type MobileVaultSync =
  | {
      state: 'localOnly'
      remote: null
      authRequirement: null
    }
  | {
      state: 'remoteReady'
      remote: MobileGitRemote
      authRequirement: MobileVaultAuthRequirement
    }

export type MobileVaultConfig = {
  id: string
  name: string
  storage: MobileVaultStorage
  sync: MobileVaultSync
}

export type CreateMobileVaultConfigInput = {
  id: string
  name: string
  remoteUrl?: string
}

export type MobileVaultConfigError = 'invalidRemoteUrl'

export type CreateMobileVaultConfigResult =
  | {
      ok: true
      config: MobileVaultConfig
    }
  | {
      ok: false
      error: MobileVaultConfigError
    }

export function createMobileVaultConfig(input: CreateMobileVaultConfigInput): CreateMobileVaultConfigResult {
  const sync = createSyncConfig(input.remoteUrl)
  if (!sync) {
    return { ok: false, error: 'invalidRemoteUrl' }
  }

  return {
    ok: true,
    config: {
      id: input.id,
      name: input.name,
      storage: createStorageConfig(input.name),
      sync,
    },
  }
}

function createSyncConfig(remoteUrl: string | undefined): MobileVaultSync | null {
  if (!remoteUrl?.trim()) {
    return { state: 'localOnly', remote: null, authRequirement: null }
  }

  const remote = parseMobileGitRemote(remoteUrl)
  return remote ? createRemoteSync(remote) : null
}

function createRemoteSync(remote: MobileGitRemote): MobileVaultSync {
  return {
    state: 'remoteReady',
    remote,
    authRequirement: {
      strategy: remote.authStrategy,
      host: remote.host,
    },
  }
}

function createStorageConfig(name: string): MobileVaultStorage {
  return {
    kind: 'appLocalGit',
    directoryName: createDirectoryName(name),
  }
}

function createDirectoryName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
