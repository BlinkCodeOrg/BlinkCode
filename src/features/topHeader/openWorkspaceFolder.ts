import { collectForUpload, uploadFolder } from '../../utils/fileSystem';
import { getNativeFolderPath } from './getNativeFolderPath';

export async function openWorkspaceFolder({
  addToast,
  dispatch,
  openFolderFromServer,
  tt,
}: {
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  dispatch: (action: any) => void;
  openFolderFromServer: (folderPath: string) => Promise<void>;
  tt: (key: string, args?: Record<string, string | number>) => string;
}): Promise<void> {
  const nativePath = await getNativeFolderPath();

  if (nativePath) {
    addToast(tt('toast.reading'), 'info');
    await openFolderFromServer(nativePath);
    return;
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
  addToast(tt('toast.opened', { '0': items.filter(i => i.type === 'file').length }), 'success');
}
