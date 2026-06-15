import { useRef } from 'react';
import { Upload } from 'lucide-react';
import type { EditorSettings, ImportedTheme } from '../../types';
import { convertVsCodeTheme } from '../../features/editorTheme/convertVsCodeTheme';
import { useT } from '../../hooks/useT';
import { useEditor } from '../../store/EditorContext';
import { Button } from '../ui/Button';

export function ThemeImportButton({ importedTheme, updateSettings }: {
  importedTheme: ImportedTheme | null;
  updateSettings: (settings: Partial<EditorSettings>) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const tt = useT();
  const { addToast } = useEditor();

  const importTheme = async (file: File | undefined) => {
    if (!file) return;
    try {
      const imported = convertVsCodeTheme(JSON.parse(await file.text()));
      updateSettings({ importedTheme: imported, theme: 'imported', colorScheme: imported.type });
      addToast(tt('settings.importThemeSuccess', { name: imported.name }), 'success');
    } catch (error) {
      addToast(tt('settings.importThemeFailed', {
        error: error instanceof Error ? error.message : tt('common.unknownError'),
      }), 'error');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="settings-theme-import">
      <input
        ref={inputRef}
        className="settings-theme-file-input"
        data-testid="theme-file-input"
        type="file"
        accept=".json,application/json"
        onChange={event => void importTheme(event.target.files?.[0])}
      />
      <Button onClick={() => inputRef.current?.click()}>
        <Upload size={12} /> {tt('settings.importTheme')}
      </Button>
      {importedTheme && <span data-testid="imported-theme-name">{importedTheme.name}</span>}
    </div>
  );
}
