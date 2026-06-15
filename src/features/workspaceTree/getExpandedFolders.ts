import type { FileNode } from '../../types';

export function getExpandedFolders(nodes: FileNode[]): string[] {
  const result: string[] = [];
  for (const node of nodes) {
    if (node.type === 'folder' && node.isExpanded && node.serverPath) result.push(node.serverPath);
    if (node.children) result.push(...getExpandedFolders(node.children));
  }
  return result;
}
