import { commonStyles } from './styles/commonStyles'
import { editorSaveStateStyles } from './styles/editorSaveStateStyles'
import { editorStyles } from './styles/editorStyles'
import { gitSyncStyles } from './styles/gitSyncStyles'
import { noteCreateStyles } from './styles/noteCreateStyles'
import { noteListStyles } from './styles/noteListStyles'
import { propertiesStyles } from './styles/propertiesStyles'
import { propertyChipStyles } from './styles/propertyChipStyles'
import { remotePromptStyles } from './styles/remotePromptStyles'
import { sidebarStyles } from './styles/sidebarStyles'
import { vaultManagementStyles } from './styles/vaultManagementStyles'
import { vaultLoadStyles } from './styles/vaultLoadStyles'

export const styles = {
  ...commonStyles,
  ...editorStyles,
  ...editorSaveStateStyles,
  ...gitSyncStyles,
  ...noteCreateStyles,
  ...noteListStyles,
  ...propertiesStyles,
  ...propertyChipStyles,
  ...remotePromptStyles,
  ...sidebarStyles,
  ...vaultManagementStyles,
  ...vaultLoadStyles,
}
