import type { FileNode } from '../../types';

export function collapseAllNodes(nodes: FileNode[]): FileNode[] {
  return nodes.map(node => ({
    ...node,
    isExpanded: false,
    children: node.children ? collapseAllNodes(node.children) : undefined,
  }));
}
