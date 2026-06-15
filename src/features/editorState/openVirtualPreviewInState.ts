import { v4 as uuid } from 'uuid';
import type { EditorState, FileNode, Tab } from '../../types';
import { getMonacoLanguage } from '../../utils/supportedWebFiles';
import { findNodeById } from '../workspaceTree/findNodeById';
import { updateNode } from '../workspaceTree/updateNode';

export function openVirtualPreviewInState(state: EditorState, node: FileNode, fallbackLanguage?: string): EditorState {
  const existing = state.openTabs.find(tab => {
    const file = findNodeById(state.files, tab.fileId);
    if (node.extensionDetail) return file?.extensionDetail?.id === node.extensionDetail.id;
    return file?.serverPath === node.serverPath;
  });

  if (existing) {
    return {
      ...state,
      files: updateNode(state.files, existing.fileId, () => node),
      activeTabId: existing.id,
    };
  }

  const tab: Tab = {
    id: uuid(),
    fileId: node.id,
    name: node.name,
    language: fallbackLanguage || node.language || getMonacoLanguage(node.name),
  };

  return {
    ...state,
    files: [...state.files, node],
    openTabs: [...state.openTabs, tab],
    activeTabId: tab.id,
  };
}
