import type { EditorSettings } from '../../types';
import { useT } from '../../hooks/useT';
import { Select } from '../ui/Select';
import { SettingsRow } from './SettingsRow';

interface SettingsWebWorkflowSectionProps {
  s: EditorSettings;
  updateSettings: (settings: Partial<EditorSettings>) => void;
}

export default function SettingsWebWorkflowSection({
  s,
  updateSettings,
}: SettingsWebWorkflowSectionProps) {
  const tt = useT();
  return (
    <div className="settings-section">
      <div className="settings-section-title">{tt('settings.webWorkflow')}</div>
      <div className="settings-section-desc">{tt('settings.webWorkflow.desc')}</div>

      <SettingsRow name={tt('settings.webWorkflow.previewBehavior')} description={tt('settings.webWorkflow.previewBehavior.desc')}>
        <Select
          ariaLabel={tt('settings.webWorkflow.previewBehavior')}
          options={[
            { value: 'ask', label: tt('settings.webWorkflow.preview.ask') },
            { value: 'auto-open', label: tt('settings.webWorkflow.preview.auto') },
            { value: 'never', label: tt('settings.webWorkflow.preview.never') },
          ]}
          value={s.webWorkflowPreviewBehavior}
          onChange={value => updateSettings({ webWorkflowPreviewBehavior: value as EditorSettings['webWorkflowPreviewBehavior'] })}
        />
      </SettingsRow>

      <SettingsRow name={tt('settings.webWorkflow.mode')} description={tt('settings.webWorkflow.mode.desc')}>
        <Select
          ariaLabel={tt('settings.webWorkflow.mode')}
          options={[
            { value: 'guided', label: tt('settings.webWorkflow.mode.guided') },
            { value: 'compact', label: tt('settings.webWorkflow.mode.compact') },
          ]}
          value={s.webWorkflowMode}
          onChange={value => updateSettings({ webWorkflowMode: value as EditorSettings['webWorkflowMode'] })}
        />
      </SettingsRow>
    </div>
  );
}
