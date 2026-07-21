import { useCallback, useState } from 'react';
import type { EditorAction, FileNode } from '../../types';
import { fetchTree } from '../../utils/api';
import { findNodeByPath } from '../workspaceTree/findNodeByPath';
import { getDroppedFolderPath } from './getDroppedFolderPath';
import { uploadDroppedFiles } from './uploadDroppedFiles';

interface SidebarExternalDropOptions {
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  dispatch: React.Dispatch<EditorAction>;
  openFile: (file: FileNode) => void | Promise<void>;
  openFolderFromServer: (path: string) => Promise<void>;
  tt: (key: string, args?: Record<string, string | number>) => string;
}

export function useSidebarExternalDrop({
  addToast,
  dispatch,
  openFile,
  openFolderFromServer,
  tt,
}: SidebarExternalDropOptions) {
  const [dropActive, setDropActive] = useState(false);
  const onDragOver = useCallback((event: React.DragEvent) => {
    if (!event.dataTransfer.types.includes('Files')) return;
    event.preventDefault();
    event.stopPropagation();
    setDropActive(true);
  }, []);
  const onDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDropActive(false);
  }, []);
  const onDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDropActive(false);
    const folderPath = getDroppedFolderPath(event.dataTransfer);
    if (folderPath) {
      await openFolderFromServer(folderPath);
      addToast(tt('explorer.openedFolder', {
        name: folderPath.split(/[\\/]/).pop() || folderPath,
      }), 'success');
      return;
    }
    const files = Array.from(event.dataTransfer.files);
    if (files.length === 0) return;
    const { failed, uploaded } = await uploadDroppedFiles(files);
    const tree = await fetchTree();
    dispatch({ type: 'SET_FILES', payload: tree.files });
    for (const serverPath of uploaded) {
      const file = findNodeByPath(tree.files, serverPath);
      if (file) await openFile(file);
    }
    if (failed.length > 0) {
      addToast(uploaded.length > 0
        ? tt('explorer.dropPartial', { failed: failed.length, uploaded: uploaded.length })
        : tt('explorer.dropFailed', { count: failed.length }), 'error');
      return;
    }
    addToast(uploaded.length === 1
      ? tt('explorer.droppedFile', { name: uploaded[0] })
      : tt('explorer.droppedFiles', { count: uploaded.length }), 'success');
  }, [addToast, dispatch, openFile, openFolderFromServer, tt]);

  return { dropActive, onDragLeave, onDragOver, onDrop };
}
