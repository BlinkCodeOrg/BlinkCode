import { useEffect, useRef, useState } from 'react';
import { useEditor } from '../../store/EditorContext';
import { useT } from '../../hooks/useT';
import { useSoftClickSound } from '../../hooks/useSoftClickSound';
import SettingsFooter from './SettingsFooter';
import SettingsGeneralTab from './SettingsGeneralTab';
import SettingsHeader from './SettingsHeader';
import SettingsKeybindingsTab from './SettingsKeybindingsTab';
import SettingsSidebar, { type SettingsTab } from './SettingsSidebar';
import { defaultKeybindings } from '../../features/keybindings/defaultKeybindings';
import { getSettingsClickSound } from '../../features/settingsPanel/getSettingsClickSound';
import { createKeyComboFromEvent } from '../../features/settingsKeybindings/createKeyComboFromEvent';
import { Modal } from '../ui/Modal';
import SettingsSnippetsTab from './SettingsSnippetsTab';
import { SettingsSearch } from './SettingsSearch';
import { useSettingsFilter } from './useSettingsFilter';
import './SettingsPanel.css';

export default function SettingsPanel() {
  const { state, toggleSettings, updateSettings, openSettingsJson } = useEditor();
  const tt = useT();
  const playSoftClick = useSoftClickSound({ enabled: state.showSettings, minIntervalMs: 55, volume: 0.035, preset: 'click' });
  const playSelectClick = useSoftClickSound({ enabled: state.showSettings, minIntervalMs: 45, volume: 0.032, preset: 'select' });
  const panelRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const matchingSettings = useSettingsFilter(panelRef, searchQuery, activeTab);

  useEffect(() => {
    if (!recordingId) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopImmediatePropagation();
        setRecordingId(null);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [recordingId]);

  if (!state.showSettings) return null;

  const s = state.settings;

  const handlePanelMouseDownCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    const sound = getSettingsClickSound(e.target as HTMLElement | null);
    if (sound === 'select') {
      playSelectClick();
      return;
    }
    if (sound === 'soft') playSoftClick();
  };

  const recordKey = (e: React.KeyboardEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.key === 'Escape') {
      setRecordingId(null);
      return;
    }
    const combo = createKeyComboFromEvent(e);
    if (!combo) return;
    const newBindings = s.keybindings.map(b => b.id === id ? { ...b, keys: combo } : b);
    updateSettings({ keybindings: newBindings });
    setRecordingId(null);
  };

  const resetKeybindings = () => {
    updateSettings({ keybindings: defaultKeybindings });
  };

  return (
    <Modal ariaLabel={tt('top.settings')} className="settings-panel" onClose={toggleSettings} ref={panelRef}>
      <div className="settings-panel-content" onMouseDownCapture={handlePanelMouseDownCapture}>
        <SettingsHeader
          onClose={toggleSettings}
          onOpenGlobalJson={() => { openSettingsJson('global'); toggleSettings(); }}
          onOpenWorkspaceJson={() => { openSettingsJson('workspace'); toggleSettings(); }}
          onToggleSearch={() => {
            setSearchOpen(open => {
              if (open) setSearchQuery('');
              return !open;
            });
          }}
          searchOpen={searchOpen}
          tt={tt}
        />
        <SettingsSearch
          open={searchOpen}
          query={searchQuery}
          tt={tt}
          onChange={setSearchQuery}
          onClose={() => { setSearchOpen(false); setSearchQuery(''); }}
        />

        <div className="settings-content">
          <SettingsSidebar activeTab={activeTab} setActiveTab={setActiveTab} tt={tt} />

          <div className="settings-main">
            {activeTab === 'general' && (
              <SettingsGeneralTab s={s} updateSettings={updateSettings} tt={tt} />
            )}

            {activeTab === 'keybindings' && (
              <SettingsKeybindingsTab
                keybindings={s.keybindings}
                onRecordKey={recordKey}
                onReset={resetKeybindings}
                recordingId={recordingId}
                setRecordingId={setRecordingId}
                tt={tt}
              />
            )}
            {activeTab === 'snippets' && (
              <SettingsSnippetsTab settings={s} updateSettings={updateSettings} />
            )}
            {searchQuery.trim() && matchingSettings === 0 && (
              <div className="settings-search-empty">{tt('settings.noResults')}</div>
            )}
          </div>
        </div>
        <SettingsFooter />
      </div>
    </Modal>
  );
}
