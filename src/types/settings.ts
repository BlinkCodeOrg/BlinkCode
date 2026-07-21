export type ActivityBarItemId = 'explorer' | 'search' | 'sourceControl' | 'debug' | 'extensions' | 'npmScripts';
export type WorkbenchPanelId = ActivityBarItemId;

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

export type EditorBackgroundPreset = 'none' | 'blink-bg-1' | 'blink-bg-2' | 'blink-bg-3' | 'blink-bg-4' | 'blink-bg-5' | 'blink-bg-6' | 'custom';
export type EditorTheme = 'tokyonight' | 'everforest' | 'ayu' | 'catppuccin' | 'catppuccin-macchiato' | 'gruvbox' | 'kanagawa' | 'nord' | 'matrix' | 'one-dark' | 'amoled' | 'imported';

export interface EditorSettings {
  autoUpdate: boolean;
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
  webWorkflowPreviewBehavior: 'auto-open' | 'ask' | 'never';
  webWorkflowMode: 'guided' | 'compact';
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
  editorBackgroundPreset: EditorBackgroundPreset;
  editorBackgroundCustom: string | null;
  editorBackgroundOpacity: number;
  editorBackgroundBlur: number;
  editorBackgroundScale: number;
  editorBackgroundBrightness: number;
  keybindings: Keybinding[];
  language: 'en' | 'ru';
  colorScheme: 'dark' | 'light' | 'system';
  theme: EditorTheme;
}
