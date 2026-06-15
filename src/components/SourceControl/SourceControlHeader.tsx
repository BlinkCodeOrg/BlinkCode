import { Download, GitBranch, RefreshCw, Upload, X } from 'lucide-react';

type SourceControlHeaderProps = {
  title: string;
  totalChanges: number;
  loading: boolean;
  remoteAction: 'pull' | 'push' | null;
  tt: (key: string) => string;
  onPull: () => void;
  onPush: () => void;
  onRefresh: () => void;
  onClose: () => void;
};

export function SourceControlHeader({
  title,
  totalChanges,
  loading,
  remoteAction,
  tt,
  onPull,
  onPush,
  onRefresh,
  onClose,
}: SourceControlHeaderProps) {
  return (
    <div className="sc-head ui-sidebar-panel-header">
      <span className="sc-title">
        <GitBranch size={14} />
        {title}
        {totalChanges > 0 && <span className="sc-badge">{totalChanges}</span>}
      </span>
      <div className="sc-head-actions">
        <button className="sc-icon-btn" title={tt('sc.pull')} onClick={onPull} disabled={loading || remoteAction !== null}>
          <Download size={14} />
        </button>
        <button className="sc-icon-btn" title={tt('sc.push')} onClick={onPush} disabled={loading || remoteAction !== null}>
          <Upload size={14} />
        </button>
        <button className="sc-icon-btn" title={tt('sc.refresh')} onClick={onRefresh} disabled={loading}>
          <RefreshCw size={14} />
        </button>
        <button className="sc-close-btn" onClick={onClose}>
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
