import { useEffect } from 'react';
import type { MutableRefObject } from 'react';
import type { EditorSettings, EditorState, FileNode } from '../../types';
import type { EditorAction } from '../../types';
import type React from 'react';
import { v4 as uuid } from 'uuid';
import { findNodeById } from '../workspaceTree/findNodeById';
import { t } from '../../utils/i18n';

type SaveTimersRef = MutableRefObject<Map<string, ReturnType<typeof setTimeout>>>;
type PersistFileNode = (file: FileNode, content: string, settings: EditorSettings) => Promise<void>;

export function useDirtyFileAutosave(
  stateRef: MutableRefObject<EditorState>,
  saveTimers: SaveTimersRef,
  persistFileNode: PersistFileNode,
  dispatch: React.Dispatch<EditorAction>,
) {
  useEffect(() => {
    const saveDirtyFiles = () => {
      const current = stateRef.current;
      if (!current.settings.autoSaveOnFocusChange) return;

      for (const tab of current.openTabs) {
        const file = findNodeById(current.files, tab.fileId);
        if (!file?.dirty || file.content === undefined) continue;
        if (saveTimers.current.has(file.id)) {
          clearTimeout(saveTimers.current.get(file.id)!);
          saveTimers.current.delete(file.id);
        }
        persistFileNode(file, file.content, current.settings).catch((error: unknown) => {
          const id = uuid();
          const reason = error instanceof Error
            ? error.message
            : t('common.unknownError', current.settings.language);
          dispatch({
            type: 'ADD_TOAST',
            payload: {
              id,
              message: t('file.autoSaveFailed', current.settings.language, { name: file.name, error: reason }),
              type: 'error',
            },
          });
          setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: { id } }), 7000);
        });
      }
    };

    const onWindowBlur = () => saveDirtyFiles();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') saveDirtyFiles();
    };

    window.addEventListener('blur', onWindowBlur);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('blur', onWindowBlur);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [dispatch, persistFileNode, saveTimers, stateRef]);
}
