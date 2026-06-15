import { v4 as uuid } from 'uuid';
import type { EditorAction, EditorState, FileNode } from '../../types';
import { fetchSettingsRaw } from '../../utils/api';
import { findNodeByPath } from '../workspaceTree/findNodeByPath';

export async function openSettingsJsonForEditor(
  scope: 'global' | 'workspace',
  state: EditorState,
  dispatch: React.Dispatch<EditorAction>,
): Promise<void> {
  try {
    const { content, path: filePath } = await fetchSettingsRaw(scope);
    const virtualPath = `__settings__/${scope}/settings.json`;
    const name = scope === 'workspace' ? 'Workspace Settings' : 'User Settings';

    const existingNode = findNodeByPath(state.files, virtualPath);
    if (existingNode) {
      const tab = state.openTabs.find(openTab => openTab.fileId === existingNode.id);
      if (tab) {
        dispatch({ type: 'SET_FILE_CONTENT', payload: { fileId: existingNode.id, content } });
        return;
      }
    }

    const node: FileNode = {
      id: uuid(),
      name,
      type: 'file',
      language: 'json',
      isExpanded: false,
      content,
      serverPath: virtualPath,
      settingsScope: scope,
      settingsFilePath: filePath,
    };
    dispatch({ type: 'OPEN_VIRTUAL_SETTINGS', payload: { node } });
  } catch (err) {
    console.error('[openSettingsJson] failed:', err);
  }
}
