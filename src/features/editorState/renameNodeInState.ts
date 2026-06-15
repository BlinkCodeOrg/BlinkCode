import type { EditorState } from '../../types';
import { getMonacoLanguage } from '../../utils/supportedWebFiles';
import { updateNode } from '../workspaceTree/updateNode';
import { rewriteNodeServerPath } from '../workspaceTree/rewriteNodeServerPath';

export function renameNodeInState(state: EditorState, nodeId: string, newName: string, newServerPath?: string): EditorState {
  const files = updateNode(state.files, nodeId, node => ({
    ...(newServerPath ? rewriteNodeServerPath(node, newServerPath) : node),
    name: newName,
    language: node.type === 'file' ? getMonacoLanguage(newName) : node.language,
  }));
  const tabs = state.openTabs.map(tab =>
    tab.fileId === nodeId ? { ...tab, name: newName, language: getMonacoLanguage(newName) } : tab,
  );

  return { ...state, files, openTabs: tabs };
}
