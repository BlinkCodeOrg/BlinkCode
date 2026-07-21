import { useEffect, useRef } from 'react';
import { renderMarkdown } from '../../features/markdownPreview/renderMarkdown';
import { hydrateLocalPreviewImages } from '../../features/markdownPreview/hydrateLocalPreviewImages';

type MarkdownPreviewTabProps = {
  sourcePath?: string;
  content: string;
  tt: (key: string) => string;
};

export function MarkdownPreviewTab({ sourcePath, content, tt }: MarkdownPreviewTabProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const applyingScroll = useRef(false);

  useEffect(() => {
    if (!bodyRef.current) return;
    return hydrateLocalPreviewImages(bodyRef.current);
  }, [content, sourcePath]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (!bodyRef.current || detail?.path !== sourcePath) return;
      const max = bodyRef.current.scrollHeight - bodyRef.current.clientHeight;
      applyingScroll.current = true;
      bodyRef.current.scrollTop = Math.max(0, max * Number(detail.ratio || 0));
      requestAnimationFrame(() => { applyingScroll.current = false; });
    };
    window.addEventListener('blinkcode:markdownEditorScroll', handler);
    return () => window.removeEventListener('blinkcode:markdownEditorScroll', handler);
  }, [sourcePath]);

  const syncEditorScroll = () => {
    const body = bodyRef.current;
    if (!body || applyingScroll.current || !sourcePath) return;
    const max = Math.max(1, body.scrollHeight - body.clientHeight);
    window.dispatchEvent(new CustomEvent('blinkcode:markdownPreviewScroll', {
      detail: { path: sourcePath, ratio: body.scrollTop / max },
    }));
  };

  return (
    <div className="markdown-preview-tab">
      <div className="markdown-preview-pane markdown-preview-pane-full">
        <div className="markdown-preview-head">
          {tt('preview.markdown')}
          {sourcePath && (
            <span className="markdown-preview-source">{sourcePath}</span>
          )}
        </div>
        <div
          ref={bodyRef}
          className="markdown-preview-body"
          onScroll={syncEditorScroll}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(content, sourcePath) }}
        />
      </div>
    </div>
  );
}
