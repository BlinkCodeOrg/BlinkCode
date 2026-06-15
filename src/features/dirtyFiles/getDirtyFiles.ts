import type { FileNode } from '../../types';

export function getDirtyFiles(files: FileNode[]): FileNode[] {
  const dirty: FileNode[] = [];
  const visit = (nodes: FileNode[]) => {
    for (const node of nodes) {
      if (node.type === 'file' && node.dirty) dirty.push(node);
      if (node.children) visit(node.children);
    }
  };
  visit(files);
  return dirty;
}
