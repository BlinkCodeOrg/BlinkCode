import type { FileNode } from '../../types';

export function getAllNodeIds(nodes: FileNode[]): string[] {
  const ids: string[] = [];
  for (const node of nodes) {
    ids.push(node.id);
    if (node.children) ids.push(...getAllNodeIds(node.children));
  }
  return ids;
}
