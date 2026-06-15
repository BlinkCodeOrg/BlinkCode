import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from 'react';

interface BottomPanelResizeOptions {
  height: number;
  width: number;
  onHeightChange: (height: number) => void;
  onWidthChange: (width: number) => void;
}

export function useBottomPanelResize({
  height,
  onHeightChange,
  onWidthChange,
  width,
}: BottomPanelResizeOptions) {
  const heightRef = useRef(height);
  const widthRef = useRef(width);
  heightRef.current = height;
  widthRef.current = width;

  const start = useCallback((
    event: ReactPointerEvent<HTMLDivElement>,
    direction: 'vertical' | 'horizontal',
  ) => {
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const startHeight = heightRef.current;
    const startWidth = widthRef.current;
    const move = (moveEvent: PointerEvent) => {
      if (direction === 'vertical') onHeightChange(startHeight + startY - moveEvent.clientY);
      else onWidthChange(Math.max(300, Math.min(760, startWidth + startX - moveEvent.clientX)));
    };
    const up = () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    document.body.style.cursor = direction === 'vertical' ? 'row-resize' : 'col-resize';
    document.body.style.userSelect = 'none';
  }, [onHeightChange, onWidthChange]);

  return {
    onBottomResizeStart: useCallback((event: ReactPointerEvent<HTMLDivElement>) => start(event, 'vertical'), [start]),
    onRightResizeStart: useCallback((event: ReactPointerEvent<HTMLDivElement>) => start(event, 'horizontal'), [start]),
  };
}
