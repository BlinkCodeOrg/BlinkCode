import { useCallback, useEffect, useState } from 'react';
import type { FileNode } from '../../types';
import {
  fetchGitFileDiff,
  fetchGitInlineDiff,
  fetchGitStatus,
  gitCommit,
  gitResolveConflict,
  gitDiscard,
  gitPull,
  gitPush,
  gitStage,
  gitUnstage,
  type GitFileEntry,
  type GitStatusResponse,
} from '../../utils/api';
import { getMonacoLanguage } from '../../utils/supportedWebFiles';
import { formatGitActionError } from './formatGitActionError';

interface UseSourceControlStateParams {
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  openDiffPreview: (node: FileNode) => void;
  tt: (key: string, values?: Record<string, string | number>) => string;
  workspaceDir: string;
}

export function useSourceControlState({
  addToast,
  openDiffPreview,
  tt,
  workspaceDir,
}: UseSourceControlStateParams) {
  const [status, setStatus] = useState<GitStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [commitMsg, setCommitMsg] = useState('');
  const [committing, setCommitting] = useState(false);
  const [amend, setAmend] = useState(false);
  const [remoteAction, setRemoteAction] = useState<'pull' | 'push' | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [discardPaths, setDiscardPaths] = useState<string[] | null>(null);
  const [selectedRoot, setSelectedRoot] = useState('');

  const refresh = useCallback(async () => {
    if (!workspaceDir) return;
    setLoading(true);
    try {
      const data = await fetchGitStatus(selectedRoot || undefined);
      setStatus(data);
      if (!selectedRoot && data.roots.length > 0) {
        setSelectedRoot((data.roots.find(root => root.primary) || data.roots[0]).ref);
      }
      window.dispatchEvent(new CustomEvent('blinkcode:gitStatusChanged', { detail: data }));
    } catch {
      setStatus(null);
    }
    setLoading(false);
  }, [selectedRoot, workspaceDir]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [refresh]);

  const toggleSection = (key: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const stage = useCallback(async (paths?: string[]) => {
    try {
      await gitStage(paths, selectedRoot);
      await refresh();
    } catch (err: any) {
      addToast(tt('sc.stageFailed') + (err?.message || ''), 'error');
    }
  }, [refresh, addToast, selectedRoot, tt]);

  const unstage = useCallback(async (paths?: string[]) => {
    try {
      await gitUnstage(paths, selectedRoot);
      await refresh();
    } catch (err: any) {
      addToast(tt('sc.unstageFailed') + (err?.message || ''), 'error');
    }
  }, [refresh, addToast, selectedRoot, tt]);

  const discard = useCallback(async (paths: string[]) => {
    if (paths.length === 0) return;
    setDiscardPaths(paths);
  }, []);

  const confirmDiscard = useCallback(async () => {
    if (!discardPaths || discardPaths.length === 0) return;

    try {
      await gitDiscard(discardPaths, selectedRoot);
      setDiscardPaths(null);
      await refresh();
    } catch (err: any) {
      addToast(tt('sc.discardFailed') + (err?.message || ''), 'error');
    }
  }, [discardPaths, refresh, addToast, selectedRoot, tt]);

  const commit = useCallback(async () => {
    if (!commitMsg.trim()) return;
    setCommitting(true);
    try {
      await gitCommit(commitMsg.trim(), amend, selectedRoot);
      setCommitMsg('');
      addToast(tt('sc.committed'), 'success');
      await refresh();
    } catch (err: any) {
      addToast(tt('sc.commitFailed') + formatGitActionError('commit', err, tt), 'error');
    }
    setCommitting(false);
  }, [amend, commitMsg, refresh, addToast, selectedRoot, tt]);

  const resolveConflict = useCallback(async (path: string, strategy: 'ours' | 'theirs' | 'resolved') => {
    try {
      await gitResolveConflict(path, strategy, selectedRoot);
      await refresh();
    } catch (err: any) {
      addToast(tt('sc.resolveFailed', { error: err?.message || tt('common.unknownError') }), 'error');
    }
  }, [addToast, refresh, selectedRoot, tt]);

  const pull = useCallback(async () => {
    setRemoteAction('pull');
    try {
      await gitPull(selectedRoot);
      addToast(tt('sc.pullSuccess'), 'success');
      await refresh();
    } catch (err: any) {
      addToast(tt('sc.pullFailed') + formatGitActionError('pull', err, tt), 'error');
    } finally {
      setRemoteAction(null);
    }
  }, [refresh, addToast, selectedRoot, tt]);

  const push = useCallback(async () => {
    setRemoteAction('push');
    try {
      await gitPush(selectedRoot);
      addToast(tt('sc.pushSuccess'), 'success');
      await refresh();
    } catch (err: any) {
      addToast(tt('sc.pushFailed') + formatGitActionError('push', err, tt), 'error');
    } finally {
      setRemoteAction(null);
    }
  }, [refresh, addToast, selectedRoot, tt]);

  const openFileDiff = useCallback(async (item: GitFileEntry, staged: boolean) => {
    try {
      const diff = await fetchGitFileDiff(item.path, staged, item.status, selectedRoot);
      const inline = await fetchGitInlineDiff(item.path, staged, item.status, selectedRoot);
      const name = item.path.split('/').pop() || item.path;
      const node: FileNode = {
        id: `git-diff:${staged ? 'staged' : 'unstaged'}:${item.path}`,
        name: `${name} (diff)`,
        type: 'file',
        serverPath: `__git_diff__/${staged ? 'staged' : 'unstaged'}/${item.path}`,
        language: getMonacoLanguage(name),
        content: diff.modified,
        dirty: false,
        diffOriginalContent: diff.original,
        diffModifiedContent: diff.modified,
        diffHunks: inline.hunks,
      };
      openDiffPreview(node);
    } catch (err: any) {
      addToast(tt('sc.diffFailed') + (err?.message || ''), 'error');
    }
  }, [openDiffPreview, addToast, selectedRoot, tt]);

  return {
    amend,
    collapsedSections,
    commit,
    commitMsg,
    committing,
    confirmDiscard,
    discard,
    discardPaths,
    loading,
    openFileDiff,
    pull,
    push,
    refresh,
    remoteAction,
    resolveConflict,
    setAmend,
    setCommitMsg,
    setDiscardPaths,
    selectedRoot,
    setSelectedRoot,
    stage,
    status,
    toggleSection,
    unstage,
  };
}
