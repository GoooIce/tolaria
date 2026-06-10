import { workspaceScenarioForId } from '../fixtures/workspaceFixtures'
import type { MobileWorkspaceSnapshot } from './mobileWorkspaceModel'

export type ReadOnlyWorkspaceRequest = {
  scenarioId?: string | null
}

export type ReadOnlyWorkspaceRepository = {
  readSnapshot: (request?: ReadOnlyWorkspaceRequest) => MobileWorkspaceSnapshot
}

export const fixtureReadOnlyWorkspaceRepository: ReadOnlyWorkspaceRepository = {
  readSnapshot: (request) => workspaceScenarioForId(request?.scenarioId),
}
