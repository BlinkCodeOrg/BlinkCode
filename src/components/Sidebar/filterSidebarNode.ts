import type { FileNode } from '../../types';

export function filterSidebarNode(node: FileNode, filter: string): boolean {
  if (node.virtual || node.extensionDetail || node.serverPath?.startsWith('__')) return false;
  if (!filter) return true;

  const query = filter.toLowerCase();
  if (node.name.toLowerCase().includes(query)) return true;

  return node.children?.some(child => filterSidebarNode(child, filter)) ?? false;
}
