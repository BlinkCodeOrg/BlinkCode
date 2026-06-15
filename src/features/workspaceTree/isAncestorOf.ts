import type { FileNode } from '../../types';
import { findNodeById } from './findNodeById';
import { getAllNodeIds } from './getAllNodeIds';

export function isAncestorOf(nodes: FileNode[], ancestorId: string, searchId: string): boolean {
  if (ancestorId === searchId) return true;
  const ancestor = findNodeById(nodes, ancestorId);
  if (!ancestor?.children) return false;
  return getAllNodeIds(ancestor.children).includes(searchId);
}
