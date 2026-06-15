import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { FileNode } from '../../types';
import { fetchGitInlineDiff, fetchGitStatus, type GitFileEntry } from '../../utils/api';
import { createGitInlineDecorations } from './createGitInlineDecorations';
import { createGitStatusCache } from './createGitStatusCache';
import { createUntrackedFileHunks } from './createUntrackedFileHunks';
import { findGitFileEntry } from './findGitFileEntry';
import { selectGitInlineTarget } from './selectGitInlineTarget';

type EditorRef = RefObject<any>;
type MonacoRef = RefObject<any>;
type GitInlineHunk = { oldStart: number; oldLines: number; newStart: number; newLines: number; type: 'added' | 'deleted' | 'modified' };

export function useGitInlineDecorations(activeFile: FileNode | null, editorRef: EditorRef, monacoRef: MonacoRef) {
  const gitDecorationsRef = useRef<string[]>([]);
  const gitStatusCacheRef = useRef<GitFileEntry[] | null>(null);
  const gitInlineCacheRef = useRef<Map<string, { hunks: GitInlineHunk[]; ts: number }>>(new Map());

  useEffect(() => {
    let cancelled = false;
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    const clearDecorations = () => {
      const editor = editorRef.current;
      if (!editor) return;
      gitDecorationsRef.current = editor.deltaDecorations(gitDecorationsRef.current, []);
    };

    const applyGitDecorations = async () => {
      const editor = editorRef.current;
      const monaco = monacoRef.current;
      if (!editor || !monaco) return;
      if (!activeFile?.serverPath || activeFile.serverPath.startsWith('__')) {
        clearDecorations();
        return;
      }

      const applyFromHunks = (hunks: GitInlineHunk[]) => {
        const decorations = createGitInlineDecorations(monaco, hunks);
        gitDecorationsRef.current = editor.deltaDecorations(gitDecorationsRef.current, decorations);
      };

      const cacheKey = activeFile.serverPath;
      const cached = gitInlineCacheRef.current.get(cacheKey);
      if (cached) {
        applyFromHunks(cached.hunks);
      }

      try {
        const status = await fetchGitStatus();
        if (cancelled) return;
        if (!status?.isRepo) {
          clearDecorations();
          return;
        }

        gitStatusCacheRef.current = createGitStatusCache(status);
        const { staged, target, unstaged } = selectGitInlineTarget(status, activeFile.serverPath);

        if (!target && gitStatusCacheRef.current) {
          const cachedTarget = findGitFileEntry(gitStatusCacheRef.current, activeFile.serverPath);
          if (cachedTarget?.status === 'untracked') {
            const localHunks = createUntrackedFileHunks(activeFile.content || '');
            applyFromHunks(localHunks);
            gitInlineCacheRef.current.set(cacheKey, { hunks: localHunks, ts: Date.now() });
            return;
          }
        }

        if (!target) {
          clearDecorations();
          return;
        }

        if (target.status === 'untracked') {
          const localHunks = createUntrackedFileHunks(activeFile.content || '');
          applyFromHunks(localHunks);
          gitInlineCacheRef.current.set(cacheKey, { hunks: localHunks, ts: Date.now() });
          return;
        }

        const diff = await fetchGitInlineDiff(activeFile.serverPath, Boolean(staged && !unstaged), target.status);
        if (cancelled) return;
        applyFromHunks(diff.hunks || []);
        gitInlineCacheRef.current.set(cacheKey, { hunks: diff.hunks || [], ts: Date.now() });
      } catch {
        clearDecorations();
      }
    };

    const hasCachedDecorations = Boolean(
      activeFile?.serverPath && gitInlineCacheRef.current.has(activeFile.serverPath),
    );
    refreshTimer = setTimeout(applyGitDecorations, hasCachedDecorations ? 450 : 0);

    return () => {
      cancelled = true;
      if (refreshTimer) clearTimeout(refreshTimer);
      clearDecorations();
    };
  }, [activeFile?.id, activeFile?.serverPath, activeFile?.content, editorRef, monacoRef]);
}
