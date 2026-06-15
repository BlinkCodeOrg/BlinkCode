import type { FileNode } from '../../types';
import type { DropPos } from './dropPosition';

export function computeDropPosition(node: FileNode | null, rect: DOMRect, clientY: number): DropPos {
  const relY = clientY - rect.top;
  const ratio = relY / rect.height;

  if (node?.type === 'folder') {
    if (ratio < 0.2) return 'before';
    if (ratio > 0.8) return 'after';
    return 'inside';
  }

  if (ratio < 0.4) return 'before';
  return 'after';
}
