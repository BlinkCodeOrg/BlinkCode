import type { FileNode } from '../../types';

export function findDebugFileByPath(nodes: FileNode[], filePath: string): FileNode | null {
  for (const node of nodes) {
    if (node.serverPath === filePath) return node;
    const child = node.children ? findDebugFileByPath(node.children, filePath) : null;
    if (child) return child;
  }
  return null;
}
