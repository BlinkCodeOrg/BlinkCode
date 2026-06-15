import type { FileNode } from '../../types';

export function getAllFileIds(nodes: FileNode[]): string[] {
  const ids: string[] = [];
  for (const node of nodes) {
    if (node.type === 'file') ids.push(node.id);
    if (node.children) ids.push(...getAllFileIds(node.children));
  }
  return ids;
}
