import { useEffect, useState } from 'react';
import { fetchRecentProjects } from '../../utils/api';

export function useRecentProjects(workspaceDir: string, fileCount: number) {
  const [recentProjects, setRecentProjects] = useState<Array<{ path: string; name: string }>>([]);

  useEffect(() => {
    fetchRecentProjects().then(setRecentProjects).catch(() => {});
  }, [workspaceDir, fileCount]);

  return recentProjects;
}
