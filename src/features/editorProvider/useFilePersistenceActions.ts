import { useCallback, type MutableRefObject } from 'react';
import type React from 'react';
import type { EditorAction, EditorSettings, EditorState, FileNode } from '../../types';
import { deleteRecoveryBuffer, fetchFileContent } from '../../utils/api';
import { findNodeById } from '../workspaceTree/findNodeById';
import { t } from '../../utils/i18n';

interface UseFilePersistenceActionsParams {
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  dispatch: React.Dispatch<EditorAction>;
  persistFileNode: (file: FileNode, content: string, settings: EditorSettings) => Promise<void>;
  saveTimers: MutableRefObject<Map<string, ReturnType<typeof setTimeout>>>;
  stateRef: MutableRefObject<EditorState>;
}

export function useFilePersistenceActions({
  addToast,
  dispatch,
  persistFileNode,
  saveTimers,
  stateRef,
}: UseFilePersistenceActionsParams) {
  const saveTab = useCallback(async (tabId: string) => {
    const current = stateRef.current;
    const tab = current.openTabs.find(item => item.id === tabId);
    const file = tab ? findNodeById(current.files, tab.fileId) : null;
    if (!file || file.content === undefined) return true;
    try {
      await persistFileNode(file, file.content, current.settings);
      return true;
    } catch (error) {
      addToast(t('file.saveFailed', current.settings.language, {
        error: error instanceof Error ? error.message : t('common.unknownError', current.settings.language),
        name: file.name,
      }), 'error');
      return false;
    }
  }, [addToast, persistFileNode, stateRef]);

  const saveAllFiles = useCallback(async () => {
    const current = stateRef.current;
    const dirtyTabs = current.openTabs.filter(tab => findNodeById(current.files, tab.fileId)?.dirty);
    const results = await Promise.all(dirtyTabs.map(tab => saveTab(tab.id)));
    return results.every(Boolean);
  }, [saveTab, stateRef]);

  const discardTabChanges = useCallback(async (tabId: string) => {
    const current = stateRef.current;
    const tab = current.openTabs.find(item => item.id === tabId);
    const file = tab ? findNodeById(current.files, tab.fileId) : null;
    if (!file) return;
    const pendingSave = saveTimers.current.get(file.id);
    if (pendingSave) {
      clearTimeout(pendingSave);
      saveTimers.current.delete(file.id);
    }
    if (file.serverPath && !file.serverPath.startsWith('__')) {
      try {
        const content = await fetchFileContent(file.serverPath);
        dispatch({ type: 'SET_FILE_CONTENT', payload: { fileId: file.id, content } });
        await deleteRecoveryBuffer(file.serverPath).catch(() => {});
      } catch {
        addToast(t('file.discardFailed', current.settings.language, { name: file.name }), 'error');
        return;
      }
    }
    dispatch({ type: 'MARK_FILE_SAVED', payload: { fileId: file.id } });
    dispatch({ type: 'CLOSE_TAB', payload: { tabId } });
  }, [addToast, dispatch, saveTimers, stateRef]);

  return { discardTabChanges, saveAllFiles, saveTab };
}
