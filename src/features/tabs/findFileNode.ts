import type { FileNode } from '../../types';

export function findFileNode(files: FileNode[], fileId: string): FileNode | null {
  for (const file of files) {
    if (file.id === fileId) return file;
    if (file.children) {
      const found = findFileNode(file.children, fileId);
      if (found) return found;
    }
  }
  return null;
}
