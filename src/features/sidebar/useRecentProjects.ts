import { useEffect, useState } from 'react';
import { fetchRecentProjects } from '../../utils/api';
import { reportRecoverableError } from '../../shared/diagnostics/reportRecoverableError';

export function useRecentProjects(workspaceDir: string, fileCount: number) {
  const [recentProjects, setRecentProjects] = useState<Array<{ path: string; name: string }>>([]);

  useEffect(() => {
    fetchRecentProjects().then(setRecentProjects).catch(error => {
      reportRecoverableError('workspace.recent-projects', error);
    });
  }, [workspaceDir, fileCount]);

  return recentProjects;
}
