import type { ReactNode } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import type { GitFileEntry } from '../../utils/api';
import { statusLabel } from '../../features/sourceControl/statusLabel';

type SourceControlSectionProps = {
  sectionKey: string;
  title: string;
  items: GitFileEntry[];
  actions: (item: GitFileEntry) => ReactNode;
  staged: boolean;
  collapsed: boolean;
  onToggle: (key: string) => void;
  onFileClick: (item: GitFileEntry, staged: boolean) => void;
  tt: (key: string) => string;
  bulkAction?: () => void;
  bulkIcon?: ReactNode;
};

export function SourceControlSection({
  sectionKey,
  title,
  items,
  actions,
  staged,
  collapsed,
  onToggle,
  onFileClick,
  tt,
  bulkAction,
  bulkIcon,
}: SourceControlSectionProps) {
  if (items.length === 0) return null;

  return (
    <div className="sc-section">
      <div className="sc-section-head" onClick={() => onToggle(sectionKey)}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          {title}
          <span className="sc-section-count">{items.length}</span>
        </span>
        <div className="sc-section-actions">
          {bulkAction && (
            <button className="sc-icon-btn" title={tt('sc.stageAll')} onClick={(e) => { e.stopPropagation(); bulkAction(); }}>
              {bulkIcon || <Plus size={14} />}
            </button>
          )}
        </div>
      </div>
      {!collapsed && items.map(item => (
        <div key={item.path} className="sc-file-item" onClick={() => onFileClick(item, staged)}>
          <span className={`sc-file-status ${item.status}`}>{statusLabel(item.status)}</span>
          <span className="sc-file-name">{item.path}</span>
          <div className="sc-file-actions">{actions(item)}</div>
        </div>
      ))}
    </div>
  );
}
