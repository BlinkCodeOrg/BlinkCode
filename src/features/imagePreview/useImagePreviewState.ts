import { useCallback, useEffect, useRef, useState } from 'react';
import { calculateCenteredPan } from './calculateCenteredPan';
import { getNextZoomIndex } from './getNextZoomIndex';
import { ZOOM_LEVELS } from './zoomLevels';

export function useImagePreviewState(activeFileId?: string) {
  const [imgError, setImgError] = useState(false);
  const [zoomIdx, setZoomIdx] = useState(5);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const previewRef = useRef<HTMLDivElement>(null);
  const prevZoomRef = useRef(1);

  useEffect(() => {
    setImgError(false);
    setZoomIdx(4);
    setPan({ x: 0, y: 0 });
    prevZoomRef.current = 1;
  }, [activeFileId]);

  const adjustPanForZoom = useCallback((oldZoom: number, newZoom: number) => {
    const el = previewRef.current;
    if (!el) return;
    setPan(currentPan => calculateCenteredPan({
      oldZoom,
      newZoom,
      currentPan,
      width: el.clientWidth,
      height: el.clientHeight,
    }));
  }, []);

  const changeZoom = useCallback((dir: 1 | -1) => {
    const oldZoom = ZOOM_LEVELS[zoomIdx];
    const nextIdx = getNextZoomIndex(zoomIdx, dir, ZOOM_LEVELS.length);
    const newZoom = ZOOM_LEVELS[nextIdx];
    setZoomIdx(nextIdx);
    adjustPanForZoom(oldZoom, newZoom);
  }, [adjustPanForZoom, zoomIdx]);

  const resetView = () => {
    setZoomIdx(4);
    setPan({ x: 0, y: 0 });
    prevZoomRef.current = 1;
  };

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        changeZoom(e.deltaY > 0 ? -1 : 1);
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [changeZoom]);

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
      e.preventDefault();
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: panStart.current.px + (e.clientX - panStart.current.x),
      y: panStart.current.py + (e.clientY - panStart.current.y),
    });
  };

  return {
    imgError,
    isPanning,
    pan,
    previewRef,
    zoom: ZOOM_LEVELS[zoomIdx],
    onImageError: () => setImgError(true),
    onMouseDown,
    onMouseMove,
    onMouseUp: () => setIsPanning(false),
    resetView,
    zoomIn: () => changeZoom(1),
    zoomOut: () => changeZoom(-1),
  };
}
