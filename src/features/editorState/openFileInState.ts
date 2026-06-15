import { v4 as uuid } from 'uuid';
import type { EditorState, FileNode, Tab } from '../../types';
import { getMonacoLanguage } from '../../utils/supportedWebFiles';

export function openFileInState(state: EditorState, file: FileNode): EditorState {
  const existing = state.openTabs.find(t => t.fileId === file.id);
  if (existing) return { ...state, activeTabId: existing.id };

  const tab: Tab = {
    id: uuid(),
    fileId: file.id,
    name: file.name,
    language: file.language || getMonacoLanguage(file.name),
  };

  return { ...state, openTabs: [...state.openTabs, tab], activeTabId: tab.id };
}
