import type { EditorState } from '../../types';
import { findNodeById } from '../workspaceTree/findNodeById';
import { insertNodeAt } from '../workspaceTree/insertNodeAt';
import { removeNode } from '../workspaceTree/removeNode';
import { rewriteNodeServerPath } from '../workspaceTree/rewriteNodeServerPath';

export function moveNodeInState(
  state: EditorState,
  nodeId: string,
  targetId: string | null,
  position: 'before' | 'after' | 'inside',
  newServerPath?: string,
): EditorState {
  if (nodeId === targetId) return state;

  const node = findNodeById(state.files, nodeId);
  if (!node) return state;
  if (position === 'inside' && targetId && findNodeById(state.files, targetId)?.type !== 'folder') return state;

  const filesWithout = removeNode(state.files, nodeId);
  return {
    ...state,
    files: insertNodeAt(filesWithout, targetId, newServerPath ? rewriteNodeServerPath(node, newServerPath) : node, position),
  };
}
