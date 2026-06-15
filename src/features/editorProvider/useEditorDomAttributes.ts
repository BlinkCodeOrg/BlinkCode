import { useEffect } from 'react';
import type { EditorSettings } from '../../types';
import { applyImportedWorkbenchTheme } from '../editorTheme/applyImportedWorkbenchTheme';

export function useEditorDomAttributes(settings: EditorSettings) {
  useEffect(() => {
    const applyScheme = () => {
      let scheme = settings.colorScheme;
      if (scheme === 'system') {
        scheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-color-scheme', scheme);
    };

    applyScheme();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (settings.colorScheme === 'system') applyScheme();
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [settings.colorScheme, settings.theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
    document.documentElement.setAttribute('data-animations', settings.animations ? '1' : '0');
    document.documentElement.setAttribute('data-file-icons', settings.showFileIcons ? '1' : '0');
    document.documentElement.setAttribute('data-compact', settings.compactMode ? '1' : '0');
  }, [settings.theme, settings.animations, settings.showFileIcons, settings.compactMode]);

  useEffect(() => {
    applyImportedWorkbenchTheme(settings.theme === 'imported' ? settings.importedTheme : null);
    return () => applyImportedWorkbenchTheme(null);
  }, [settings.importedTheme, settings.theme]);
}
