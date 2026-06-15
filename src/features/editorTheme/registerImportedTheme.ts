import type { ImportedTheme } from '../../types';

const colorMap: Record<string, string> = {
  'editor.background': 'editor.background',
  'editor.foreground': 'editor.foreground',
  'editor.selectionBackground': 'editor.selectionBackground',
  'editor.lineHighlightBackground': 'editor.lineHighlightBackground',
  'editorCursor.foreground': 'editorCursor.foreground',
  'editorLineNumber.foreground': 'editorLineNumber.foreground',
};

export function registerImportedTheme(monaco: any, theme: ImportedTheme | null) {
  if (!theme) return;
  const colors = Object.fromEntries(
    Object.entries(colorMap)
      .filter(([source]) => typeof theme.colors[source] === 'string')
      .map(([source, target]) => [target, theme.colors[source]]),
  );
  const rules = theme.tokenColors.flatMap(token => {
    const scopes = Array.isArray(token.scope) ? token.scope : String(token.scope || '').split(',');
    return scopes.filter(Boolean).map(scope => ({
      token: scope.trim(),
      foreground: token.settings?.foreground?.replace('#', ''),
      background: token.settings?.background?.replace('#', ''),
      fontStyle: token.settings?.fontStyle,
    }));
  });
  monaco.editor.defineTheme('blinkcode-imported', {
    base: theme.type === 'light' ? 'vs' : 'vs-dark',
    inherit: true,
    colors,
    rules,
  });
}
