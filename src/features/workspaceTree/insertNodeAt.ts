import type { FileNode } from '../../types';
import { sortNodes } from './sortNodes';

export function insertNodeAt(nodes: FileNode[], targetId: string | null, newNode: FileNode, position: 'before' | 'after' | 'inside'): FileNode[] {
  if (position === 'inside' && targetId) {
    return nodes.map(node => {
      if (node.id === targetId && node.type === 'folder') {
        const children = sortNodes([...(node.children || []), newNode]);
        return { ...node, children, isExpanded: true };
      }
      if (node.children) return { ...node, children: insertNodeAt(node.children, targetId, newNode, position) };
      return node;
    });
  }

  if (position === 'before' || position === 'after') {
    for (let i = 0; i < nodes.length; i += 1) {
      if (nodes[i].id === targetId) {
        const result = [...nodes];
        result.splice(position === 'before' ? i : i + 1, 0, newNode);
        return sortNodes(result);
      }
      if (nodes[i].children) {
        const newChildren = insertNodeAt(nodes[i].children!, targetId, newNode, position);
        if (newChildren !== nodes[i].children!) {
          return nodes.map(node => node.id === nodes[i].id ? { ...node, children: sortNodes(newChildren) } : node);
        }
      }
    }
  }

  return sortNodes([...nodes, newNode]);
}
