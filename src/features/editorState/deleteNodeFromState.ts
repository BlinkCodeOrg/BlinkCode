import type { EditorState } from '../../types';
import { findNodeById } from '../workspaceTree/findNodeById';
import { getAllFileIds } from '../workspaceTree/getAllFileIds';
import { removeNode } from '../workspaceTree/removeNode';

export function deleteNodeFromState(state: EditorState, nodeId: string): EditorState {
  const node = findNodeById(state.files, nodeId);
  if (!node) return state;

  const fileIds = node.type === 'folder' ? getAllFileIds(node.children || []) : [node.id];
  const tabs = state.openTabs.filter(t => !fileIds.includes(t.fileId));
  let activeId = state.activeTabId;

  if (fileIds.some(fileId => state.openTabs.find(t => t.fileId === fileId && t.id === state.activeTabId))) {
    activeId = tabs.length > 0 ? tabs[tabs.length - 1].id : null;
  }

  return { ...state, files: removeNode(state.files, nodeId), openTabs: tabs, activeTabId: activeId };
}
