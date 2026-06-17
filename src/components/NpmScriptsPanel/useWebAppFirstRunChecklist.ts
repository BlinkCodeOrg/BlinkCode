import { useEffect, useMemo, useState } from 'react';
import type { WebWorkflowAnalysis } from '../../utils/api';

export interface WebAppFirstRunChecklistState {
  detectPackage: boolean;
  findDevScript: boolean;
  openPreview: boolean;
  checkErrors: boolean;
}

interface StoredChecklist extends WebAppFirstRunChecklistState {
  completed?: boolean;
}

const STORAGE_KEY = 'blinkcode-web-app-first-run';

const emptyChecklist: StoredChecklist = {
  detectPackage: false,
  findDevScript: false,
  openPreview: false,
  checkErrors: false,
};

function workspaceKey(workspaceDir: string) {
  return workspaceDir || '__empty_workspace__';
}

function readStore(): Record<string, StoredChecklist> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, StoredChecklist>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {}
}

function isComplete(state: WebAppFirstRunChecklistState) {
  return state.detectPackage && state.findDevScript && state.openPreview && state.checkErrors;
}

export function useWebAppFirstRunChecklist({
  browserOpen,
  loading,
  suggestedUrl,
  workflow,
  workspaceDir,
}: {
  browserOpen: boolean;
  loading: boolean;
  suggestedUrl: string | null;
  workflow: WebWorkflowAnalysis | null;
  workspaceDir: string;
}) {
  const [stored, setStored] = useState<StoredChecklist>(emptyChecklist);
  const [hydratedKey, setHydratedKey] = useState<string | null>(null);
  const key = workspaceKey(workspaceDir);

  useEffect(() => {
    setStored(readStore()[key] || emptyChecklist);
    setHydratedKey(key);
  }, [key]);

  const current = useMemo<WebAppFirstRunChecklistState>(() => ({
    detectPackage: Boolean(workflow?.packages.length),
    findDevScript: Boolean(workflow?.devServerScripts.length),
    openPreview: Boolean(suggestedUrl || browserOpen),
    checkErrors: !loading && Boolean(workflow),
  }), [browserOpen, loading, suggestedUrl, workflow]);

  const progress = useMemo<WebAppFirstRunChecklistState>(() => ({
    detectPackage: stored.detectPackage || current.detectPackage,
    findDevScript: stored.findDevScript || current.findDevScript,
    openPreview: stored.openPreview || current.openPreview,
    checkErrors: stored.checkErrors || current.checkErrors,
  }), [current, stored]);

  useEffect(() => {
    if (hydratedKey !== key) return;
    const completed = isComplete(progress);
    const next = { ...progress, completed };
    if (
      stored.completed === next.completed
      && stored.detectPackage === next.detectPackage
      && stored.findDevScript === next.findDevScript
      && stored.openPreview === next.openPreview
      && stored.checkErrors === next.checkErrors
    ) return;
    const store = readStore();
    store[key] = next;
    writeStore(store);
    setStored(next);
  }, [hydratedKey, key, progress, stored]);

  return {
    checklist: progress,
    completed: stored.completed || isComplete(progress),
  };
}
