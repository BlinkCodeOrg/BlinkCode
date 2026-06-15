import type { FileNode, EditorSettings } from '../../types';
import { deleteRecoveryBuffer, fetchEditorConfigCached, saveFile, saveSettingsRaw } from '../../utils/api';
import type { EditorConfigProperties } from '../../utils/api';
import { isSupportedWebFile } from '../../utils/supportedWebFiles';

type SaveFileNodeParams = {
  file: FileNode;
  content: string;
  settings: EditorSettings;
  markSaved: (fileId: string) => void;
  updateContent: (fileId: string, content: string) => void;
  updateSettings: (settings: Partial<EditorSettings>) => void;
};

export async function saveFileNode({
  file,
  content,
  settings,
  markSaved,
  updateContent,
  updateSettings,
}: SaveFileNodeParams) {
  if (file.serverPath?.startsWith('__settings__/')) {
    const scope = file.settingsScope || 'global';
    await saveSettingsRaw(content, scope);
    markSaved(file.id);
    try {
      updateSettings(JSON.parse(content));
    } catch {}
    return;
  }

  if (!file.serverPath || !isSupportedWebFile(file.name)) return;

  const editorConfig: EditorConfigProperties = await fetchEditorConfigCached(file.serverPath).catch(() => ({}));
  const trimTrailingWhitespace = editorConfig.trim_trailing_whitespace === undefined
    ? settings.trimTrailingWhitespace
    : editorConfig.trim_trailing_whitespace === 'true';
  const insertFinalNewline = editorConfig.insert_final_newline === undefined
    ? settings.insertFinalNewline
    : editorConfig.insert_final_newline === 'true';
  let contentToSave = content;
  if (trimTrailingWhitespace) {
    contentToSave = contentToSave.split('\n').map(line => line.replace(/\s+$/, '')).join('\n');
  }
  if (insertFinalNewline && contentToSave && !contentToSave.endsWith('\n')) {
    contentToSave += '\n';
  }
  if (editorConfig.end_of_line === 'crlf') contentToSave = contentToSave.replace(/\r?\n/g, '\r\n');
  if (editorConfig.end_of_line === 'cr') contentToSave = contentToSave.replace(/\r?\n/g, '\r');
  if (editorConfig.end_of_line === 'lf') contentToSave = contentToSave.replace(/\r\n?/g, '\n');

  await saveFile(file.serverPath, contentToSave);
  await deleteRecoveryBuffer(file.serverPath).catch(() => {});

  if (contentToSave !== content) {
    updateContent(file.id, contentToSave);
  }

  markSaved(file.id);
}
