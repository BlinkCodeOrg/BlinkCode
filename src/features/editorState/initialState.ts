import type { EditorState } from '../../types';
import { loadSettings } from '../editorSettings/loadSettings';
import { migrateKeybindings } from '../editorSettings/migrateKeybindings';

const loadedSettings = loadSettings();
loadedSettings.keybindings = migrateKeybindings(loadedSettings.keybindings);

const initialState: EditorState = {
  files: [],
  openTabs: [],
  activeTabId: null,
  splitActiveTabId: null,
  viewMode: 'editor',
  browserOpen: false,
  browserUrl: null,
  browserLoading: false,
  browserCanGoBack: false,
  browserCanGoForward: false,
  browserError: null,
  showAIPanel: false,
  showSettings: false,
  showSearchPanel: false,
  showSourceControl: false,
  showExtensions: false,
  showNpmScripts: false,
  showDebugPanel: false,
  showProblemsPanel: false,
  zenMode: false,
  sidebarWidth: 250,
  sidebarVisible: true,
  toasts: [],
  terminalOpen: false,
  terminalHeight: 220,
  bottomPanelTab: 'terminal',
  bottomPanelMaximized: false,
  bottomPanelOpen: false,
  terminalInstances: [],
  activeTerminalId: null,
  settings: loadedSettings,
  pendingCreate: null,
  workspaceDir: '',
};


export { initialState };
