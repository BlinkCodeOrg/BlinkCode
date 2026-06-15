import { useEffect, useRef, useState } from 'react';
import type { FileNode } from '../../types';
import { fetchGitBlameLine, type GitBlameLineInfo } from '../../utils/api';

export function useGitInlineBlame(activeFile: FileNode | null, enabled: boolean): GitBlameLineInfo | null {
  const gitBlameCacheRef = useRef<Map<string, GitBlameLineInfo | null>>(new Map());
  const blameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [blameInfo, setBlameInfo] = useState<GitBlameLineInfo | null>(null);

  useEffect(() => {
    setBlameInfo(null);
    if (blameTimerRef.current) {
      clearTimeout(blameTimerRef.current);
      blameTimerRef.current = null;
    }
  }, [activeFile?.id]);

  useEffect(() => {
    if (!enabled) {
      setBlameInfo(null);
      return;
    }
    const isNormalFile = Boolean(activeFile?.serverPath && !activeFile.serverPath.startsWith('__'));
    if (!isNormalFile) {
      setBlameInfo(null);
      return;
    }

    const onCursor = (ev: Event) => {
      const line = Number((ev as CustomEvent)?.detail?.line || 0);
      if (!line || !activeFile?.serverPath) return;

      const key = `${activeFile.serverPath}:${line}`;
      if (gitBlameCacheRef.current.has(key)) {
        setBlameInfo(gitBlameCacheRef.current.get(key) || null);
        return;
      }

      if (blameTimerRef.current) clearTimeout(blameTimerRef.current);
      blameTimerRef.current = setTimeout(async () => {
        try {
          const data = await fetchGitBlameLine(activeFile.serverPath!, line);
          gitBlameCacheRef.current.set(key, data.blame || null);
          setBlameInfo(data.blame || null);
        } catch {
          setBlameInfo(null);
        }
      }, 220);
    };

    window.addEventListener('blinkcode:cursorPosition', onCursor as EventListener);
    return () => {
      window.removeEventListener('blinkcode:cursorPosition', onCursor as EventListener);
      if (blameTimerRef.current) {
        clearTimeout(blameTimerRef.current);
        blameTimerRef.current = null;
      }
    };
  }, [activeFile?.id, activeFile?.serverPath, enabled]);

  return blameInfo;
}
