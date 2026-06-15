import type { FileNode } from '../../types';

export function updateNode(nodes: FileNode[], id: string, updater: (node: FileNode) => FileNode): FileNode[] {
  return nodes.map(node => {
    if (node.id === id) return updater(node);
    if (node.children) return { ...node, children: updateNode(node.children, id, updater) };
    return node;
  });
}
