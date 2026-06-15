import type { FileNode } from '../../types';

export function findNodeByPath(nodes: FileNode[], serverPath: string): FileNode | null {
  for (const node of nodes) {
    if (node.serverPath === serverPath) return node;
    if (node.children) {
      const found = findNodeByPath(node.children, serverPath);
      if (found) return found;
    }
  }
  return null;
}
