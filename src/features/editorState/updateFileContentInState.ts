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
  if (dirty && file?.binary) return state;

  const detectedBinary = !dirty && content.startsWith('base64:');
  const safeContent = detectedBinary ? '' : content;
  let files = updateNode(state.files, fileId, (node) => ({
    ...node,
    content: safeContent,
    dirty,
    ...(detectedBinary ? { binary: true } : {}),
  }));
  if (!detectedBinary && file?.serverPath) {
    files = updateMarkdownPreviews(files, file.serverPath, safeContent);
  }
  return { ...state, files };
}
