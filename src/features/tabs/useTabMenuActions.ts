import type { EditorState, FileNode } from '../../types';
import { getFileNameFromPath } from '../../shared/path/getFileNameFromPath';
import { joinWorkspacePath } from '../../shared/path/joinWorkspacePath';
import { toWindowsPath } from '../../shared/path/toWindowsPath';
import { createMarkdownPreviewNode } from '../markdownPreview/createMarkdownPreviewNode';
import { isMarkdownSourceFile } from '../markdownPreview/isMarkdownSourceFile';
import { findFileNode } from './findFileNode';

interface UseTabMenuActionsParams {
  closeMenu: () => void;
  closeTab: (tabId: string) => void;
  discardTabChanges: (tabId: string) => Promise<void>;
  menuTabId: string | null;
  openMarkdownPreview: (node: FileNode) => void;
  splitTab: (tabId: string) => void;
  saveTab: (tabId: string) => Promise<boolean>;
  state: EditorState;
}

export function useTabMenuActions({
  closeMenu,
  closeTab,
  discardTabChanges,
  menuTabId,
  openMarkdownPreview,
  splitTab,
  saveTab,
  state,
}: UseTabMenuActionsParams) {
  const getMenuFile = (): FileNode | null => {
    if (!menuTabId) return null;
    const tab = state.openTabs.find(openTab => openTab.id === menuTabId);
    if (!tab) return null;
    return findFileNode(state.files, tab.fileId);
  };

  const save = async () => {
    if (!menuTabId) return;
    const saved = await saveTab(menuTabId);
    if (saved) closeTab(menuTabId);
    closeMenu();
  };

  const dontSave = async () => {
    if (!menuTabId) return;
    await discardTabChanges(menuTabId);
    closeMenu();
  };

  const copyPath = async (kind: 'absolute' | 'relative' | 'name') => {
    const file = getMenuFile();
    if (!file?.serverPath) return;
    try {
      const value = kind === 'absolute'
        ? joinWorkspacePath(state.workspaceDir, file.serverPath)
        : kind === 'name'
          ? getFileNameFromPath(file.serverPath)
          : toWindowsPath(file.serverPath);
      await navigator.clipboard.writeText(value);
    } catch {}
    closeMenu();
  };

  const revealInExplorer = async () => {
    const file = getMenuFile();
    if (!file?.serverPath) return;
    try {
      await window.electronAPI?.revealInFolder?.(joinWorkspacePath(state.workspaceDir, file.serverPath));
    } catch {}
    closeMenu();
  };

  const markdownPreview = () => {
    const file = getMenuFile();
    if (!file?.serverPath || !isMarkdownSourceFile(file)) return;
    openMarkdownPreview(createMarkdownPreviewNode(file));
    closeMenu();
  };

  const closeOnly = () => {
    if (!menuTabId) return;
    closeTab(menuTabId);
    closeMenu();
  };

  const split = () => {
    if (!menuTabId) return;
    if (getMenuFile()?.extensionDetail) {
      closeMenu();
      return;
    }
    splitTab(menuTabId);
    closeMenu();
  };

  const closeAll = () => {
    state.openTabs.forEach(tab => closeTab(tab.id));
    closeMenu();
  };

  return {
    closeAll,
    closeOnly,
    copyPath,
    dontSave,
    getMenuFile,
    markdownPreview,
    revealInExplorer,
    save,
    split,
  };
}
