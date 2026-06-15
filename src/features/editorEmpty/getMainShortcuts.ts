export function getMainShortcuts(tt: (key: string) => string): Array<{ keys: string; label: string }> {
  return [
    { keys: 'Ctrl+S', label: tt('kb.save') },
    { keys: 'Ctrl+Shift+P', label: tt('kb.commandPalette') },
    { keys: 'Ctrl+P', label: tt('kb.quickOpen') },
    { keys: 'Ctrl+Shift+F', label: tt('kb.workspaceSearch') },
    { keys: 'Ctrl+W', label: tt('kb.closeTab') },
    { keys: 'Ctrl+`', label: tt('kb.toggleTerminal') },
  ];
}
