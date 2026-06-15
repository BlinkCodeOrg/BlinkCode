import type { EditorState } from '../../types';
import { updateMarkdownPreviews } from '../markdownPreview/updateMarkdownPreviews';
import { findNodeById } from '../workspaceTree/findNodeById';
import { updateNode } from '../workspaceTree/updateNode';

export function updateFileContentInState(
  state: EditorState,
  fileId: string,
  content: string,
  dirty: boolean,
): EditorState {
  const file = findNodeById(state.files, fileId);
  let files = updateNode(state.files, fileId, node => ({ ...node, content, dirty }));
  if (file?.serverPath) files = updateMarkdownPreviews(files, file.serverPath, content);
  return { ...state, files };
}
