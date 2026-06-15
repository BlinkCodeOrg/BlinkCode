import { useRef, useState } from 'react';
import type { FileNode } from '../../types';
import { findNodeById } from '../workspaceTree/findNodeById';
import { isAncestorOf } from '../workspaceTree/isAncestorOf';
import { computeDropPosition } from './computeDropPosition';
import type { DragState } from '../../components/Sidebar/sidebarTypes';

interface UseSidebarDragAndDropParams {
  files: FileNode[];
  itemEls: React.RefObject<Map<string, HTMLDivElement>>;
  moveNode: (nodeId: string, targetId: string | null, position: 'before' | 'after' | 'inside') => void;
}

export function useSidebarDragAndDrop({
  files,
  itemEls,
  moveNode,
}: UseSidebarDragAndDropParams) {
  const [drag, setDrag] = useState<DragState>({ overId: null, position: null });
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragSrc = useRef<string | null>(null);

  const computePos = (nodeId: string, event: React.DragEvent): DragState['position'] => {
    const el = itemEls.current.get(nodeId);
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const node = findNodeById(files, nodeId);
    return computeDropPosition(node, rect, event.clientY);
  };

  const clearDrag = () => {
    setDrag({ overId: null, position: null });
    dragSrc.current = null;
    setDraggingId(null);
  };

  const onDragStart = (id: string) => {
    dragSrc.current = id;
    setDraggingId(id);
  };

  const onDragOver = (event: React.DragEvent, id: string) => {
    event.preventDefault();
    if (!dragSrc.current || dragSrc.current === id) return;
    event.stopPropagation();
    if (isAncestorOf(files, dragSrc.current, id)) return;
    setDrag({ overId: id, position: computePos(id, event) });
  };

  const onDrop = (event: React.DragEvent, id: string) => {
    event.preventDefault();
    const src = dragSrc.current;
    if (!src || src === id || isAncestorOf(files, src, id)) return;
    event.stopPropagation();
    const pos = computePos(id, event);
    if (pos) moveNode(src, id, pos);
    clearDrag();
  };

  const onDragLeave = (event: React.DragEvent) => {
    if (dragSrc.current) event.stopPropagation();
    setDrag({ overId: null, position: null });
  };

  const moveDraggedToRoot = () => {
    if (!dragSrc.current) return;
    moveNode(dragSrc.current, null, 'after');
    clearDrag();
  };

  return {
    drag,
    draggingId,
    hasDraggedNode: () => !!dragSrc.current,
    moveDraggedToRoot,
    onDragEnd: clearDrag,
    onDragLeave,
    onDragOver,
    onDragStart,
    onDrop,
  };
}
