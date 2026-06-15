import type { MouseEvent, RefObject } from 'react';
import { FileWarning, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

type ImagePreviewProps = {
  previewRef: RefObject<HTMLDivElement | null>;
  src: string;
  zoom: number;
  pan: { x: number; y: number };
  isPanning: boolean;
  imgError: boolean;
  tt: (key: string) => string;
  onMouseDown: (event: MouseEvent) => void;
  onMouseMove: (event: MouseEvent) => void;
  onMouseUp: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onImageError: () => void;
};

export function ImagePreview({
  previewRef,
  src,
  zoom,
  pan,
  isPanning,
  imgError,
  tt,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onZoomIn,
  onZoomOut,
  onResetView,
  onImageError,
}: ImagePreviewProps) {
  return (
    <div className="editor-preview" ref={previewRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
    >
      {imgError ? (
        <div className="preview-error">
          <FileWarning size={32} />
          <span>{tt('preview.cannotDisplay')}</span>
        </div>
      ) : (
        <img
          src={src}
          alt=""
          className="preview-image"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}
          onError={onImageError}
          draggable={false}
        />
      )}
      <div className="preview-toolbar">
        <button className="preview-zoom-btn" onClick={onZoomOut} title={tt('zoom.out')}><ZoomOut size={14} /></button>
        <span className="preview-zoom-val">{Math.round(zoom * 100)}%</span>
        <button className="preview-zoom-btn" onClick={onZoomIn} title={tt('zoom.in')}><ZoomIn size={14} /></button>
        <button className="preview-zoom-btn" onClick={onResetView} title={tt('zoom.reset')}><RotateCcw size={13} /></button>
      </div>
    </div>
  );
}
