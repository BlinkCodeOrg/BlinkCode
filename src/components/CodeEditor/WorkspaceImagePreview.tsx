import { LoaderCircle } from 'lucide-react';
import { useAuthenticatedFileUrl } from '../../features/imagePreview/useAuthenticatedFileUrl';
import { useImagePreviewState } from '../../features/imagePreview/useImagePreviewState';
import { ImagePreview } from './ImagePreview';

type WorkspaceImagePreviewProps = {
  fileId: string;
  serverPath: string;
  tt: (key: string) => string;
};

export function WorkspaceImagePreview({ fileId, serverPath, tt }: WorkspaceImagePreviewProps) {
  const source = useAuthenticatedFileUrl(serverPath);
  const preview = useImagePreviewState(fileId);

  if (source.loading) {
    return (
      <div className="editor-preview">
        <div className="preview-error">
          <LoaderCircle className="preview-loading-icon" size={26} />
          <span>{tt('common.loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <ImagePreview
      previewRef={preview.previewRef}
      src={source.url}
      zoom={preview.zoom}
      pan={preview.pan}
      isPanning={preview.isPanning}
      imgError={source.error || preview.imgError}
      tt={tt}
      onMouseDown={preview.onMouseDown}
      onMouseMove={preview.onMouseMove}
      onMouseUp={preview.onMouseUp}
      onZoomIn={preview.zoomIn}
      onZoomOut={preview.zoomOut}
      onResetView={preview.resetView}
      onImageError={preview.onImageError}
    />
  );
}
