import { FolderOpen } from 'lucide-react';

interface RecentProject {
  name: string;
  path: string;
}

interface SidebarEmptyStateProps {
  emptyHint: string;
  openFolderLabel: string;
  recentProjects: RecentProject[];
  recentProjectsTitle: string;
  onOpenFolder: () => void;
  onOpenRecentProject: (path: string) => void;
}

export function SidebarEmptyState({
  emptyHint,
  onOpenFolder,
  onOpenRecentProject,
  openFolderLabel,
  recentProjects,
  recentProjectsTitle,
}: SidebarEmptyStateProps) {
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
