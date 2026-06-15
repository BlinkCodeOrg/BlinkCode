import { FileJson, Search, Settings, X } from 'lucide-react';

export default function SettingsHeader({
  onClose,
  onOpenGlobalJson,
  onOpenWorkspaceJson,
  onToggleSearch,
  searchOpen,
  tt,
}: {
  onClose: () => void;
  onOpenGlobalJson: () => void;
  onOpenWorkspaceJson: () => void;
  onToggleSearch: () => void;
  searchOpen: boolean;
  tt: (key: string) => string;
}) {
  return (
    <div className="settings-head">
      <div className="settings-head-left">
        <Settings size={15} className="settings-icon" />
        <span className="settings-title">{tt('settings.title')}</span>
      </div>
      <div className="settings-head-actions">
        <button
          className={`settings-icon-btn ${searchOpen ? 'active' : ''}`}
          data-testid="settings-search-toggle"
          title={tt('settings.search')}
          onClick={onToggleSearch}
        >
          <Search size={14} />
        </button>
        <button
          className="settings-json-btn"
          title={tt('settings.openJson')}
          onClick={onOpenGlobalJson}
        >
          <FileJson size={14} />
          <span>{tt('settings.globalJson')}</span>
        </button>
        <button
          className="settings-json-btn"
          title={tt('settings.openWorkspaceJson')}
          onClick={onOpenWorkspaceJson}
        >
          <FileJson size={14} />
          <span>{tt('settings.workspaceJson')}</span>
        </button>
        <button className="settings-close" onClick={onClose}><X size={15} /></button>
      </div>
    </div>
  );
}
