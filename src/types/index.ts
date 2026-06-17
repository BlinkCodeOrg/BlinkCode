export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  content?: string;
  language?: string;
  isExpanded?: boolean;
  serverPath?: string;
  binary?: boolean;
  dirty?: boolean;
  size?: number;
  settingsScope?: 'global' | 'workspace';
  settingsFilePath?: string;
  diffOriginalContent?: string;
  diffModifiedContent?: string;
  diffHunks?: Array<{ oldStart: number; oldLines: number; newStart: number; newLines: number; type: 'added' | 'deleted' | 'modified' }>;
  markdownPreviewContent?: string;
  markdownPreviewSourcePath?: string;
  largePreviewContent?: string;
  largePreviewOffset?: number;
  largePreviewDone?: boolean;
  virtual?: boolean;
  extensionDetail?: {
    id: string;
    displayName: string;
    publisher: string;
    version: string;
    description: string;
    categories: string[];
    permissions: string[];
    iconDataUrl: string;
    readme: string;
    cacheSizeBytes: number;
    packageSizeBytes: number;
    installedAt: string | null;
    license: string | null;
    publishedAt: string | null;
    lastUpdatedAt: string | null;
    lastReleasedAt: string | null;
    resources: Partial<Record<'repository' | 'issues' | 'license' | 'marketplace' | 'publisher', string>>;
  };
}
export interface Tab {
  id: string;
  fileId: string;
  name: string;
  language?: string;
  pinned?: boolean;
}
export type ActivityBarItemId = 'explorer' | 'search' | 'sourceControl' | 'debug' | 'extensions' | 'npmScripts';
export type WorkbenchPanelId = ActivityBarItemId;
export interface ToastItem { id: string; message: string; type: 'success' | 'error' | 'info'; }
export interface TerminalLine {
  id: string;
  text: string;
  type: 'input' | 'output' | 'error' | 'info' | 'system';
}
export interface TerminalInstance {
  id: string;
  name: string;
  cwd: string;
  title?: string;
  cursor?: number;
  startupCommand?: string;
  scriptKey?: string;
  status?: 'idle' | 'starting' | 'running' | 'exited' | 'stopped' | 'failed';
  exitCode?: number;
}
export interface Keybinding {
  id: string;
  label: string;
  keys: string;
}
export interface UserSnippet {
  id: string;
  name: string;
  languages: string[];
  prefix: string;
  body: string;
  description?: string;
}
export interface ImportedTheme {
  name: string;
  type: 'dark' | 'light';
  colors: Record<string, string>;
  tokenColors: Array<{
    scope?: string | string[];
    settings?: { foreground?: string; background?: string; fontStyle?: string };
  }>;
}
export interface EditorSettings {
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  stickyScroll: boolean;
  autoSaveDelay: number;
  autoSaveOnFocusChange: boolean;
  fontLigatures: boolean;
  lineNumbers: boolean;
  cursorBlinking: 'smooth' | 'blink' | 'phase' | 'expand' | 'solid';
  fontFamily: string;
  cursorStyle: 'line' | 'block' | 'underline' | 'line-thin' | 'block-outline';
  renderWhitespace: 'none' | 'boundary' | 'all';
  bracketPairColorization: boolean;
  autoClosingBrackets: boolean;
  smoothScrolling: boolean;
  tailwindTooling: boolean;
  tailwindClassSorting: boolean;
  webWorkflowPreviewBehavior: 'auto-open' | 'ask' | 'never'; webWorkflowMode: 'guided' | 'compact';
  aiInlineCompletions: boolean;
  gitInlineBlame: boolean;
  envMaskSecrets: boolean;
  spellChecker: boolean;
  snippets: UserSnippet[];
  importedTheme: ImportedTheme | null;
  trimTrailingWhitespace: boolean;
  insertFinalNewline: boolean;
  insertSpaces: boolean;
  animations: boolean;
  showFileIcons: boolean;
  compactMode: boolean;
  uiDensity: 'compact' | 'default' | 'comfortable';
  uiScale: number;
  explorerRowHeight: number;
  activityBarOrder: ActivityBarItemId[];
  hiddenActivityBarItems: ActivityBarItemId[];
  panelWidths: Record<WorkbenchPanelId, number>;
  bottomPanelPosition: 'bottom' | 'right';
  bottomPanelWidth: number;
  dotGridColor: string;
  backgroundStyle: 'dotgrid' | 'solid';
  keybindings: Keybinding[];
  language: 'en' | 'ru';
  colorScheme: 'dark' | 'light' | 'system';
  theme: 'tokyonight' | 'everforest' | 'ayu' | 'catppuccin' | 'catppuccin-macchiato' | 'gruvbox' | 'kanagawa' | 'nord' | 'matrix' | 'one-dark' | 'amoled' | 'imported';
}
export interface EditorState {
  files: FileNode[];
  openTabs: Tab[];
  activeTabId: string | null;
  splitActiveTabId: string | null;
  viewMode: 'editor' | 'split';
  browserOpen: boolean;
  browserUrl: string | null;
  browserLoading: boolean;
  browserCanGoBack: boolean;
  browserCanGoForward: boolean;
  browserError: string | null;
  showAIPanel: boolean;
  showSettings: boolean;
  showSearchPanel: boolean;
  showSourceControl: boolean;
  showExtensions: boolean;
  showNpmScripts: boolean;
  showDebugPanel: boolean;
  showProblemsPanel: boolean;
  zenMode: boolean;
  sidebarWidth: number;
  sidebarVisible: boolean;
  toasts: ToastItem[];
  terminalOpen: boolean;
  terminalHeight: number;
  bottomPanelTab: 'terminal' | 'problems' | 'output' | 'debugConsole';
  bottomPanelMaximized: boolean;
  bottomPanelOpen: boolean;
  terminalInstances: TerminalInstance[];
  activeTerminalId: string | null;
  settings: EditorSettings;
  pendingCreate: { type: 'file' | 'folder'; parentId?: string } | null;
  workspaceDir: string;
}
export interface SavedEditorState {
  openTabs?: Array<{ serverPath: string; name: string; language: string; isBinary?: boolean; pinned?: boolean }>;
  activeTabServerPath?: string | null;
  splitActiveTabServerPath?: string | null;
  sidebarWidth?: number;
  sidebarVisible?: boolean;
  terminalOpen?: boolean;
  terminalHeight?: number;
  bottomPanelTab?: EditorState['bottomPanelTab'];
  bottomPanelOpen?: boolean;
  viewMode?: 'editor' | 'split';
  showAIPanel?: boolean;
  zenMode?: boolean;
  settings?: Partial<EditorSettings>;
  expandedFolders?: string[];
  folderClosed?: boolean;
  workspaceDir?: string;
  onboardingDismissed?: boolean;
  recentProjects?: Array<{ path: string; name: string }>;
}
export type EditorAction =
  | { type: 'SET_FILES'; payload: FileNode[] }
  | { type: 'OPEN_FILE'; payload: { file: FileNode } }
  | { type: 'CLOSE_TAB'; payload: { tabId: string } }
  | { type: 'SET_ACTIVE_TAB'; payload: { tabId: string } }
  | { type: 'UPDATE_FILE_CONTENT'; payload: { fileId: string; content: string } }
  | { type: 'TOGGLE_FOLDER'; payload: { folderId: string } }
  | { type: 'ADD_FILE'; payload: { parentId: string | null; name: string; type: 'file' | 'folder'; serverPath?: string } }
  | { type: 'DELETE_NODE'; payload: { nodeId: string } }
  | { type: 'RENAME_NODE'; payload: { nodeId: string; newName: string; newServerPath?: string } }
  | { type: 'MOVE_NODE'; payload: { nodeId: string; targetId: string | null; position: 'before' | 'after' | 'inside'; newServerPath?: string } }
  | { type: 'SET_VIEW_MODE'; payload: { mode: 'editor' | 'split' } }
  | { type: 'OPEN_BROWSER_PREVIEW'; payload: { url: string } }
  | { type: 'CLOSE_BROWSER_PREVIEW' }
  | { type: 'SET_BROWSER_URL'; payload: { url: string | null } }
  | { type: 'SET_BROWSER_LOADING'; payload: { loading: boolean } }
  | { type: 'SET_BROWSER_NAV_STATE'; payload: { canGoBack: boolean; canGoForward: boolean } }
  | { type: 'SET_BROWSER_ERROR'; payload: { error: string | null } }
  | { type: 'TOGGLE_AI_PANEL' }
  | { type: 'SET_SIDEBAR_WIDTH'; payload: { width: number } }
  | { type: 'ADD_TOAST'; payload: ToastItem }
  | { type: 'REMOVE_TOAST'; payload: { id: string } }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'REORDER_TABS'; payload: { tabs: Tab[] } }
  | { type: 'TOGGLE_PIN_TAB'; payload: { tabId: string } }
  | { type: 'TOGGLE_TERMINAL' }
  | { type: 'SET_TERMINAL_HEIGHT'; payload: { height: number } }
  | { type: 'SET_BOTTOM_PANEL_TAB'; payload: { tab: EditorState['bottomPanelTab'] } }
  | { type: 'SET_BOTTOM_PANEL_OPEN'; payload: { open: boolean } }
  | { type: 'TOGGLE_BOTTOM_PANEL_MAXIMIZED' }
  | { type: 'ADD_TERMINAL_INSTANCE'; payload: TerminalInstance }
  | { type: 'REMOVE_TERMINAL_INSTANCE'; payload: { id: string } }
  | { type: 'SET_ACTIVE_TERMINAL'; payload: { id: string } }
  | { type: 'ADD_TERMINAL_LINE'; payload: { instanceId: string; line: TerminalLine } }
  | { type: 'UPDATE_TERMINAL_CWD'; payload: { instanceId: string; cwd: string } }
  | { type: 'SET_TERMINAL_STATUS'; payload: { instanceId: string; status: TerminalInstance['status']; exitCode?: number } }
  | { type: 'CLEAR_TERMINAL'; payload: { instanceId: string } }
  | { type: 'COLLAPSE_ALL' }
  | { type: 'CLOSE_FOLDER' }
  | { type: 'SET_FILE_CONTENT'; payload: { fileId: string; content: string } }
  | { type: 'SET_LARGE_FILE_PREVIEW'; payload: { fileId: string; content: string; offset: number; done: boolean } }
  | { type: 'MARK_FILE_SAVED'; payload: { fileId: string } }
  | { type: 'SHOW_NEW_FILE'; payload: { type: 'file' | 'folder' } }
  | { type: 'CLEAR_PENDING_CREATE' }
  | { type: 'RESTORE_STATE'; payload: SavedEditorState }
  | { type: 'TOGGLE_SETTINGS' }
  | { type: 'TOGGLE_SEARCH_PANEL' }
  | { type: 'TOGGLE_SOURCE_CONTROL' }
  | { type: 'TOGGLE_EXTENSIONS' }
  | { type: 'TOGGLE_NPM_SCRIPTS' }
  | { type: 'TOGGLE_DEBUG_PANEL' }
  | { type: 'TOGGLE_PROBLEMS_PANEL' }
  | { type: 'TOGGLE_ZEN_MODE' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<EditorSettings> }
  | { type: 'SET_WORKSPACE_DIR'; payload: string }
  | { type: 'FS_ADD_NODE'; payload: { serverPath: string; name: string; type: 'file' | 'folder' } }
  | { type: 'FS_REMOVE_NODE'; payload: { serverPath: string } }
  | { type: 'SPLIT_TAB'; payload: { tabId: string } }
  | { type: 'SET_SPLIT_ACTIVE_TAB'; payload: { tabId: string | null } }
  | { type: 'CLOSE_SPLIT_TAB' }
  | { type: 'OPEN_VIRTUAL_SETTINGS'; payload: { node: FileNode } }
  | { type: 'OPEN_DIFF_PREVIEW'; payload: { node: FileNode } }
  | { type: 'OPEN_MARKDOWN_PREVIEW'; payload: { node: FileNode } }
  | { type: 'OPEN_EXTENSION_DETAIL'; payload: { node: FileNode } };
