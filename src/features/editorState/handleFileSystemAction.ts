import type { EditorAction, EditorState } from '../../types';
import { addNodeByPath } from '../workspaceTree/addNodeByPath';
import { findNodeByPath } from '../workspaceTree/findNodeByPath';
import { getAllFileIds } from '../workspaceTree/getAllFileIds';
import { removeNode } from '../workspaceTree/removeNode';

type FileSystemAction = Extract<
  EditorAction,
  | { type: 'FS_ADD_NODE' }
  | { type: 'FS_REMOVE_NODE' }
>;

export function handleFileSystemAction(state: EditorState, action: FileSystemAction): EditorState {
  switch (action.type) {
    case 'FS_ADD_NODE': {
      const { serverPath, name, type } = action.payload;
      if (findNodeByPath(state.files, serverPath)) return state;
      const segments = serverPath.split('/').slice(0, -1);
      return { ...state, files: addNodeByPath(state.files, segments, type, name, serverPath) };
    }
    case 'FS_REMOVE_NODE': {
      const { serverPath } = action.payload;
      const target = findNodeByPath(state.files, serverPath);
      if (!target) return state;
      const hasDirtyFile = (nodes: typeof state.files): boolean => nodes.some(node => (
        Boolean(node.dirty) || Boolean(node.children && hasDirtyFile(node.children))
      ));
      if (hasDirtyFile([target])) return state;
      const toCloseIds = target.type === 'folder' ? getAllFileIds([target]) : [target.id];
      const tabs = state.openTabs.filter(tab => !toCloseIds.includes(tab.fileId));
      let activeId = state.activeTabId;
      if (activeId && !tabs.find(tab => tab.id === activeId)) {
        activeId = tabs.length > 0 ? tabs[tabs.length - 1].id : null;
      }
      return {
        ...state,
        files: removeNode(state.files, target.id),
        openTabs: tabs,
        activeTabId: activeId,
      };
    }
  }
}
