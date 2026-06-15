import type React from 'react';
import type { EditorAction } from '../../types';
import { collectForUpload, uploadFolder } from '../../utils/fileSystem';

type OpenFolderFromPickerParams = {
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  dispatch: React.Dispatch<EditorAction>;
  openFolderFromServer: (dirPath: string) => Promise<void>;
  tt: (key: string, values?: Record<string, string | number>) => string;
};

export async function openFolderFromPicker({ addToast, dispatch, openFolderFromServer, tt }: OpenFolderFromPickerParams) {
  const api = (window as any).electronAPI || (window as any).electron || (window as any).desktop;

  try {
    const picker = api?.openFolder || api?.pickFolder || api?.selectFolder;
    if (typeof picker === 'function') {
      const result = await picker();
      const folderPath = typeof result === 'string'
        ? result
        : result?.path || result?.paths?.[0] || null;

      if (folderPath) {
        addToast(tt('toast.reading'), 'info');
        await openFolderFromServer(folderPath);
        return;
      }
    }

    if (!('showDirectoryPicker' in window)) {
      addToast(tt('toast.openFolder'), 'error');
      return;
    }

    const dirHandle = await (window as any).showDirectoryPicker({ mode: 'read' });
    addToast(tt('toast.reading'), 'info');
    const items = await collectForUpload(dirHandle, '', 0);
    if (items.length === 0) {
      addToast(tt('toast.empty'), 'error');
      return;
    }
    const result = await uploadFolder(dirHandle.name, items);
    dispatch({ type: 'SET_FILES', payload: result.files });
    dispatch({ type: 'SET_WORKSPACE_DIR', payload: '' });
    addToast(tt('toast.opened', { '0': items.filter(item => item.type === 'file').length }), 'success');
  } catch (err: any) {
    if (err?.name !== 'AbortError') {
      addToast(tt('toast.openFail') + (err?.message || ''), 'error');
    }
  }
}
