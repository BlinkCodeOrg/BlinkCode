import { useCallback, useEffect, useState } from 'react';
import { fetchGitStatus, type GitStatusResponse } from '../../utils/api';
import { createExplorerGitDecorations, type ExplorerGitDecoration } from './createExplorerGitDecorations';

export type { ExplorerGitDecoration } from './createExplorerGitDecorations';

export function useExplorerGitDecorations(workspaceDir: string) {
  const [decorations, setDecorations] = useState<Map<string, ExplorerGitDecoration>>(new Map());
  const refresh = useCallback(async () => {
    if (!workspaceDir) {
      setDecorations(new Map());
      return;
    }
    try {
      setDecorations(createExplorerGitDecorations(await fetchGitStatus()));
    } catch {
      setDecorations(new Map());
    }
  }, [workspaceDir]);

  useEffect(() => {
    void refresh();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(refresh, 180);
    };
    const applyStatus = (event: Event) => {
      const status = (event as CustomEvent<GitStatusResponse>).detail;
      if (status) setDecorations(createExplorerGitDecorations(status));
      else schedule();
    };
    window.addEventListener('blinkcode:fileSystemChanged', schedule);
    window.addEventListener('blinkcode:gitStatusChanged', applyStatus);
    window.addEventListener('focus', schedule);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('blinkcode:fileSystemChanged', schedule);
      window.removeEventListener('blinkcode:gitStatusChanged', applyStatus);
      window.removeEventListener('focus', schedule);
    };
  }, [refresh]);

  return decorations;
}
