import type { EditorSettings } from '../../types';
import SettingsAppearanceSection from './SettingsAppearanceSection';
import SettingsEditorSection from './SettingsEditorSection';
import SettingsFilesSection from './SettingsFilesSection';
import SettingsUpdatesSection from './SettingsUpdatesSection';
import SettingsWebWorkflowSection from './SettingsWebWorkflowSection';

export default function SettingsGeneralTab({
  s,
  tt,
  updateSettings,
}: {
  s: EditorSettings;
  tt: (key: string) => string;
  updateSettings: (settings: Partial<EditorSettings>) => void;
}) {
  return (
    <>
      <SettingsEditorSection s={s} updateSettings={updateSettings} tt={tt} />
      <SettingsWebWorkflowSection s={s} updateSettings={updateSettings} />
      <SettingsFilesSection s={s} updateSettings={updateSettings} tt={tt} />
      <SettingsAppearanceSection s={s} updateSettings={updateSettings} tt={tt} />
      <SettingsUpdatesSection tt={tt} />
    </>
  );
}
