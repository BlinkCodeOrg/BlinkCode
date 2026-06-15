import type { FileNode } from '../../types';

export function removeNode(nodes: FileNode[], id: string): FileNode[] {
  return nodes.filter(node => node.id !== id).map(node => {
    if (node.children) return { ...node, children: removeNode(node.children, id) };
    return node;
  });
}
