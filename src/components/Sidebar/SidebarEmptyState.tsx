import { FilePlus2, FolderOpen, FolderPlus } from 'lucide-react';

interface RecentProject {
  name: string;
  path: string;
}

interface SidebarEmptyStateProps {
  emptyHint: string;
  openFolderLabel: string;
  recentProjects: RecentProject[];
  recentProjectsTitle: string;
  workspaceOpen: boolean;
  onOpenFolder: () => void;
  onOpenRecentProject: (path: string) => void;
  onCreate: (type: 'file' | 'folder') => void;
  tt: (key: string) => string;
}

export function SidebarEmptyState({
  emptyHint,
  onOpenFolder,
  onOpenRecentProject,
  openFolderLabel,
  recentProjects,
  recentProjectsTitle,
  workspaceOpen,
  onCreate,
  tt,
}: SidebarEmptyStateProps) {
  if (workspaceOpen) {
    return (
      <div className="sidebar-empty sidebar-empty-workspace">
        <div className="sidebar-empty-mark"><FolderOpen size={18} /></div>
        <div className="sidebar-empty-text">{tt('explorer.emptyFolder')}</div>
        <div className="sidebar-empty-actions">
          <button className="sidebar-empty-open-btn" onClick={() => onCreate('file')}>
            <FilePlus2 size={14} />{tt('explorer.newFile')}
          </button>
          <button className="sidebar-empty-open-btn" onClick={() => onCreate('folder')}>
            <FolderPlus size={14} />{tt('explorer.newFolder')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar-empty">
      <div className="sidebar-empty-mark">
        <FolderOpen size={18} />
      </div>
      <div className="sidebar-empty-text">{emptyHint}</div>
      {recentProjects.length > 0 && (
        <div className="sidebar-recent-projects">
          <div className="sidebar-recent-title">{recentProjectsTitle}</div>
          <div className="sidebar-recent-list">
            {recentProjects.map(project => (
              <button
                key={project.path}
                className="sidebar-recent-item"
                onClick={() => onOpenRecentProject(project.path)}
                title={project.path}
              >
                <span className="sidebar-recent-name">{project.name}</span>
                <span className="sidebar-recent-path">{project.path}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <button className="sidebar-empty-open-btn" onClick={onOpenFolder}>
        <FolderOpen size={14} />
        {openFolderLabel}
      </button>
    </div>
  );
}
