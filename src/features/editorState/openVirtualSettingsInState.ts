import { v4 as uuid } from 'uuid';
import type { EditorState, FileNode, Tab } from '../../types';
import { findNodeById } from '../workspaceTree/findNodeById';

export function openVirtualSettingsInState(state: EditorState, node: FileNode): EditorState {
  const existing = state.openTabs.find(tab => {
    const file = findNodeById(state.files, tab.fileId);
    return file?.serverPath === node.serverPath;
  });

  if (existing) {
    return { ...state, activeTabId: existing.id };
  }

  const tab: Tab = { id: uuid(), fileId: node.id, name: node.name, language: 'json' };
  return {
    ...state,
    files: [...state.files, node],
    openTabs: [...state.openTabs, tab],
    activeTabId: tab.id,
  };
}
