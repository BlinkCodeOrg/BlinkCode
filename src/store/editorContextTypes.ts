import type React from 'react';
import type {
  EditorAction,
  EditorSettings,
  EditorState,
  FileNode,
  SavedEditorState,
  Tab,
  TerminalInstance,
  TerminalLine,
  ToastItem,
} from '../types';

export interface EditorContextValue {
  state: EditorState;
  dispatch: React.Dispatch<EditorAction>;
  openFile: (file: FileNode) => void;
  closeTab: (tabId: string) => void;
  discardTabChanges: (tabId: string) => Promise<void>;
  saveAllFiles: () => Promise<boolean>;
  saveTab: (tabId: string) => Promise<boolean>;
  setActiveTab: (tabId: string) => void;
  updateFileContent: (fileId: string, content: string) => void;
  toggleFolder: (folderId: string) => void;
  addFile: (parentId: string | null, name: string, type: 'file' | 'folder') => void;
  deleteNode: (nodeId: string) => void;
  renameNode: (nodeId: string, newName: string) => void;
  moveNode: (nodeId: string, targetId: string | null, position: 'before' | 'after' | 'inside') => void;
  setViewMode: (mode: 'editor' | 'split') => void;
  openBrowserPreview: (url: string) => void;
  closeBrowserPreview: () => void;
  setBrowserUrl: (url: string | null) => void;
  setBrowserLoading: (loading: boolean) => void;
  setBrowserNavState: (canGoBack: boolean, canGoForward: boolean) => void;
  setBrowserError: (error: string | null) => void;
  toggleAIPanel: () => void;
  setSidebarWidth: (width: number) => void;
  addToast: (message: string, type: ToastItem['type']) => void;
  removeToast: (id: string) => void;
  toggleSidebar: () => void;
  getActiveFile: () => FileNode | null;
  getSplitActiveFile: () => FileNode | null;
  splitTab: (tabId: string) => void;
  closeSplitTab: () => void;
  setSplitActiveTab: (tabId: string | null) => void;
  reorderTabs: (tabs: Tab[]) => void;
  toggleTerminal: () => void;
  setTerminalHeight: (h: number) => void;
  addTerminalInstance: (inst: TerminalInstance) => void;
  removeTerminalInstance: (id: string) => void;
  setActiveTerminal: (id: string) => void;
  addTerminalLine: (instanceId: string, text: string, type: TerminalLine['type']) => void;
  updateTerminalCwd: (instanceId: string, cwd: string) => void;
  setTerminalStatus: (instanceId: string, status: TerminalInstance['status'], exitCode?: number) => void;
  clearTerminal: (instanceId: string) => void;
  collapseAll: () => void;
  loadFromServer: () => Promise<void>;
  openFolderFromServer: (dirPath: string) => Promise<void>;
  toggleSettings: () => void;
  toggleSearchPanel: () => void;
  toggleSourceControl: () => void;
  toggleExtensions: () => void;
  toggleNpmScripts: () => void;
  toggleDebugPanel: () => void;
  toggleProblemsPanel: () => void;
  toggleZenMode: () => void;
  updateSettings: (s: Partial<EditorSettings>) => void;
  openSettingsJson: (scope?: 'global' | 'workspace') => Promise<void>;
  openDiffPreview: (node: FileNode) => void;
  openMarkdownPreview: (node: FileNode) => void;
  openExtensionDetail: (node: FileNode) => void;
  registerEditor: (editor: any) => void;
  triggerEditorAction: (action: 'undo' | 'redo') => void;
}

export type { SavedEditorState };
