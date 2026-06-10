import { useWindowDimensions } from 'react-native'
import { PhoneWorkspaceMock, type PhoneWorkspaceState } from './PhoneWorkspaceMock'
import { TabletWorkspace } from './TabletWorkspace'
import { fixtureReadOnlyWorkspaceRepository } from '../workspace/readOnlyWorkspaceRepository'

export function MobileUiLab() {
  const { width } = useWindowDimensions()
  const isWideEnoughForTablet = width >= 900
  const snapshot = fixtureReadOnlyWorkspaceRepository.readSnapshot({ scenarioId: currentScenarioId() })

  if (isWideEnoughForTablet) {
    return <TabletWorkspace snapshot={snapshot} />
  }

  return <PhoneWorkspaceMock initialState={currentPhoneState()} snapshot={snapshot} />
}

function currentScenarioId() {
  const search = (globalThis as { location?: { search?: string } }).location?.search

  if (!search) return null

  return new URLSearchParams(search).get('scenario')
}

function currentPhoneState(): PhoneWorkspaceState {
  const search = (globalThis as { location?: { search?: string } }).location?.search

  if (!search) return 'list'

  const value = new URLSearchParams(search).get('phoneState')

  if (value === 'editor' || value === 'sidebar') return value

  return 'list'
}
