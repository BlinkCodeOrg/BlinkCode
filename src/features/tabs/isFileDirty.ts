import type { FileNode } from '../../types';

export function isFileDirty(files: FileNode[], fileId: string): boolean {
  for (const file of files) {
    if (file.id === fileId) return Boolean(file.dirty);
    if (file.children && isFileDirty(file.children, fileId)) return true;
  }
  return false;
}
