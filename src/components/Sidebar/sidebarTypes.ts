import type { DropPos } from '../../features/sidebar/dropPosition';

export interface InlineInput {
  parentId: string | null;
  type: 'file' | 'folder';
  value: string;
}

export interface DragState {
  overId: string | null;
  position: DropPos;
}
