import { useCallback } from 'react';
import { useT } from '../../hooks/useT';
import { useEditor } from '../../store/EditorContext';
import { openWorkspaceFolder } from './openWorkspaceFolder';

export function useOpenWorkspaceFolder() {
  const { addToast, dispatch, openFolderFromServer } = useEditor();
  const tt = useT();
  return useCallback(async () => {
    try {
      await openWorkspaceFolder({
        addToast,
        dispatch,
        openFolderFromServer,
        tt,
      });
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        addToast(tt('toast.openFail') + (error.message || ''), 'error');
      }
    }
  }, [addToast, dispatch, openFolderFromServer, tt]);
}
