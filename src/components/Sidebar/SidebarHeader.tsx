import { FilePlus, FolderPlus, FolderX, FolderTree, RefreshCw, Search } from 'lucide-react';
import type { InlineInput } from './sidebarTypes';
import { useT } from '../../hooks/useT';

interface SidebarHeaderProps {
  closeFolderTitle: string;
  fileCount: number;
  setInline: (inline: InlineInput) => void;
  title: string;
  toggleFilter: () => void;
  onCloseFolder: () => void;
  onRefresh: () => void;
  onAddRoot: () => void;
}

export function SidebarHeader({
  closeFolderTitle,
  fileCount,
  onCloseFolder,
  onAddRoot,
  onRefresh,
  setInline,
  title,
  toggleFilter,
}: SidebarHeaderProps) {
  const tt = useT();
  return (
    <div className="sidebar-section-head ui-sidebar-panel-header">
      <span className="sidebar-section-title">{title}</span>
      <div className="sidebar-section-actions">
        <button className="sec-btn" onClick={toggleFilter} title={tt('explorer.filter')}>
          <Search size={13} />
        </button>
        <button className="sec-btn" onClick={() => setInline({ parentId: null, type: 'file', value: '' })} title={tt('explorer.newFile')}>
          <FilePlus size={13} />
        </button>
        <button className="sec-btn" onClick={() => setInline({ parentId: null, type: 'folder', value: '' })} title={tt('explorer.newFolder')}>
          <FolderPlus size={13} />
        </button>
        <button className="sec-btn" onClick={onAddRoot} title={tt('explorer.addWorkspaceFolder')}>
          <FolderTree size={13} />
        </button>
        <button className="sec-btn" onClick={onRefresh} title={tt('explorer.refresh')}>
          <RefreshCw size={13} />
        </button>
        {fileCount > 0 && (
          <button className="sec-btn" onClick={onCloseFolder} title={closeFolderTitle}>
            <FolderX size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
