import type { ImportedTheme } from '../../types';

const variableMap: Record<string, string> = {
  'editor.background': '--bg-editor',
  'sideBar.background': '--bg-sidebar',
  'activityBar.background': '--bg-activity',
  'panel.background': '--bg-panel',
  'editor.foreground': '--text-primary',
  'descriptionForeground': '--text-muted',
  'focusBorder': '--accent',
  'input.background': '--bg-input',
  'input.foreground': '--text-primary',
};

export function applyImportedWorkbenchTheme(theme: ImportedTheme | null) {
  const root = document.documentElement;
  for (const variable of Object.values(variableMap)) root.style.removeProperty(variable);
  if (!theme) return;
  for (const [source, variable] of Object.entries(variableMap)) {
    const color = theme.colors[source];
    if (color) root.style.setProperty(variable, color);
  }
}
