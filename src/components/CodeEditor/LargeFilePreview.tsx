import { useState } from 'react';
import type { FileNode } from '../../types';
import { fetchLargeFilePreview } from '../../utils/api';
import { useT } from '../../hooks/useT';

type LargeFilePreviewProps = {
  file: FileNode;
  onUpdate: (content: string, offset: number, done: boolean) => void;
};

export function LargeFilePreview({ file, onUpdate }: LargeFilePreviewProps) {
  const tt = useT();
  const [loading, setLoading] = useState(false);
  const loadMore = async () => {
    if (!file.serverPath || file.largePreviewDone) return;
    setLoading(true);
    try {
      const chunk = await fetchLargeFilePreview(file.serverPath, file.largePreviewOffset || 0);
      onUpdate(`${file.largePreviewContent || ''}${chunk.content}`, chunk.offset, chunk.done);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="large-file-preview">
      <div className="large-file-preview-head">
        <span>{tt('preview.streaming')}</span>
        <span>{Math.min(file.largePreviewOffset || 0, file.size || 0).toLocaleString()} / {(file.size || 0).toLocaleString()} {tt('common.bytes')}</span>
      </div>
      <pre className="large-file-preview-content">{file.largePreviewContent || tt('preview.noText')}</pre>
      {!file.largePreviewDone && (
        <button className="large-file-preview-more" onClick={loadMore} disabled={loading}>
          {loading ? tt('common.loading') : tt('preview.loadNext')}
        </button>
      )}
    </div>
  );
}
