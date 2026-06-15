import { addWorkspaceRoot } from '../../utils/api';

export async function addWorkspaceRootFromPicker({
  addToast,
  loadFromServer,
  tt,
}: {
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  loadFromServer: () => Promise<void>;
  tt: (key: string, args?: Record<string, string | number>) => string;
}) {
  const folderPath = await window.electronAPI?.openFolder?.();
  if (!folderPath) {
    addToast(tt('explorer.multiRootDesktopOnly'), 'info');
    return;
  }
  await addWorkspaceRoot(folderPath);
  await loadFromServer();
  addToast(tt('explorer.workspaceFolderAdded', { name: folderPath.split(/[\\/]/).pop() || folderPath }), 'success');
}
