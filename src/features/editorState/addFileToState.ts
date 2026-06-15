import { v4 as uuid } from 'uuid';
import type { EditorState, FileNode } from '../../types';
import { getMonacoLanguage } from '../../utils/supportedWebFiles';
import { insertNodeAt } from '../workspaceTree/insertNodeAt';
import { sortNodes } from '../workspaceTree/sortNodes';

export function addFileToState(state: EditorState, parentId: string | null, name: string, type: 'file' | 'folder', serverPath?: string): EditorState {
  const newNode: FileNode = {
    id: uuid(),
    name,
    type,
    isExpanded: type === 'folder',
    content: type === 'file' ? '' : undefined,
    language: type === 'file' ? getMonacoLanguage(name) : undefined,
    children: type === 'folder' ? [] : undefined,
    serverPath,
  };

  if (parentId) {
    return { ...state, files: insertNodeAt(state.files, parentId, newNode, 'inside') };
  }

  return { ...state, files: sortNodes([...state.files, newNode]) };
}
