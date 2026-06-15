export type RegisteredCommand = {
  id: string;
  defaultKeys: string;
  nativeMonaco?: boolean;
};

export const commandRegistry: RegisteredCommand[] = [
  { id: 'commandPalette', defaultKeys: 'Ctrl+Shift+P' },
  { id: 'quickOpen', defaultKeys: 'Ctrl+P' },
  { id: 'recentFiles', defaultKeys: 'Ctrl+Tab' },
  { id: 'workspaceSearch', defaultKeys: 'Ctrl+Shift+F' },
  { id: 'sourceControl', defaultKeys: 'Ctrl+Shift+G' },
  { id: 'problemsPanel', defaultKeys: 'Ctrl+Shift+M' },
  { id: 'splitEditor', defaultKeys: 'Ctrl+\\' },
  { id: 'save', defaultKeys: 'Ctrl+S' },
  { id: 'saveAll', defaultKeys: 'Ctrl+Shift+S' },
  { id: 'toggleSidebar', defaultKeys: 'Ctrl+B' },
  { id: 'toggleTerminal', defaultKeys: 'Ctrl+`' },
  { id: 'toggleAI', defaultKeys: 'Ctrl+I' },
  { id: 'toggleSettings', defaultKeys: 'Ctrl+,' },
  { id: 'newFile', defaultKeys: 'Ctrl+N' },
  { id: 'closeTab', defaultKeys: 'Ctrl+W' },
  { id: 'closeAllTabs', defaultKeys: 'Ctrl+K Ctrl+W' },
  { id: 'zoomIn', defaultKeys: 'Ctrl+=' },
  { id: 'zoomOut', defaultKeys: 'Ctrl+-' },
  { id: 'find', defaultKeys: 'Ctrl+F', nativeMonaco: true },
  { id: 'replace', defaultKeys: 'Ctrl+H', nativeMonaco: true },
  { id: 'undo', defaultKeys: 'Ctrl+Z' },
  { id: 'redo', defaultKeys: 'Ctrl+Shift+Z' },
  { id: 'goToLine', defaultKeys: 'Ctrl+G', nativeMonaco: true },
  { id: 'toggleWordWrap', defaultKeys: 'Alt+Z' },
  { id: 'toggleZenMode', defaultKeys: 'Ctrl+K Ctrl+Z' },
  { id: 'comment', defaultKeys: 'Ctrl+/', nativeMonaco: true },
  { id: 'formatDocument', defaultKeys: 'Shift+Alt+F' },
];
