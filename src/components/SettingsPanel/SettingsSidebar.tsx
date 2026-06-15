import { Braces, Keyboard, Settings } from 'lucide-react';

export type SettingsTab = 'general' | 'keybindings' | 'snippets';

export default function SettingsSidebar({
  activeTab,
  setActiveTab,
  tt,
}: {
  activeTab: SettingsTab;
  setActiveTab: (tab: SettingsTab) => void;
  tt: (key: string) => string;
}) {
  return (
    <div className="settings-sidebar">
      <button
        className={`settings-menu-item ${activeTab === 'general' ? 'active' : ''}`}
        onClick={() => setActiveTab('general')}
      >
        <Settings size={14} />
        <span>{tt('settings.general')}</span>
      </button>
      <button
        className={`settings-menu-item ${activeTab === 'snippets' ? 'active' : ''}`}
        data-testid="settings-snippets-tab"
        onClick={() => setActiveTab('snippets')}
      >
        <Braces size={14} />
        <span>{tt('settings.snippets')}</span>
      </button>
      <button
        className={`settings-menu-item ${activeTab === 'keybindings' ? 'active' : ''}`}
        data-testid="settings-keybindings-tab"
        onClick={() => setActiveTab('keybindings')}
      >
        <Keyboard size={14} />
        <span>{tt('settings.keybindings')}</span>
      </button>
    </div>
  );
}
