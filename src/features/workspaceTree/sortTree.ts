import type { FileNode } from '../../types';
import { sortNodes } from './sortNodes';

export function sortTree(nodes: FileNode[]): FileNode[] {
  return sortNodes(nodes).map(node => ({
    ...node,
    children: node.children ? sortTree(node.children) : undefined,
  }));
}
