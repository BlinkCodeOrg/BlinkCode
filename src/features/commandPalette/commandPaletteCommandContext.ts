import type { Dispatch } from 'react';
import type { EditorAction, EditorState, Tab } from '../../types';

export interface CommandPaletteCommandContext {
  activeTab?: Tab;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  closeBrowserPreview: () => void;
  closeSplitTab: () => void;
  closeTab: (tabId: string) => void;
  collapseAll: () => void;
  dispatch: Dispatch<EditorAction>;
  openFolderFromServer: (dirPath: string) => Promise<void>;
  runMonacoAction: (actionId: string) => void;
  settings: EditorState['settings'];
  splitTab: (tabId: string) => void;
  state: EditorState;
  toggleAIPanel: () => void;
  toggleSettings: () => void;
  toggleSidebar: () => void;
  toggleTerminal: () => void;
  tt: (key: string, values?: Record<string, string | number>) => string;
  triggerEditorAction: (action: 'undo' | 'redo') => void;
  updateSettings: (settings: Partial<EditorState['settings']>) => void;
}

export type CreateCommandPaletteCommandsParams = Omit<
  CommandPaletteCommandContext,
  'activeTab' | 'settings'
>;
