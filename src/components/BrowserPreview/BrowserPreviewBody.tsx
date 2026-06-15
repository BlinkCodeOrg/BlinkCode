import type { RefObject } from 'react';
import { Globe, ShieldAlert } from 'lucide-react';
import { useT } from '../../hooks/useT';

type BrowserPreviewBodyProps = {
  iframeRef: RefObject<HTMLIFrameElement | null>;
  browserUrl: string | null;
  browserError: string | null;
  validatedUrl: string | null;
  isSupportedUrl: boolean;
  onIframeLoad: () => void;
  onIframeError: () => void;
  device: 'responsive' | 'mobile' | 'tablet';
};

export function BrowserPreviewBody({
  iframeRef,
  browserUrl,
  browserError,
  validatedUrl,
  isSupportedUrl,
  onIframeLoad,
  onIframeError,
  device,
}: BrowserPreviewBodyProps) {
  const tt = useT();
  return (
    <div className="browser-preview-body">
      {!browserUrl && (
        <div className="browser-preview-empty-state">
          <Globe size={32} />
          <h2>{tt('browser.title')}</h2>
          <p>{tt('browser.empty')}</p>
        </div>
      )}

      {browserUrl && !isSupportedUrl && (
        <div className="browser-preview-empty-state browser-preview-empty-state-error">
          <ShieldAlert size={32} />
          <h2>{tt('browser.blockedTitle')}</h2>
          <p>{tt('browser.blockedMessage')}</p>
        </div>
      )}

      {browserUrl && isSupportedUrl && (
        <>
          {browserError && (
            <div className="browser-preview-overlay browser-preview-overlay-error">
              <ShieldAlert size={22} />
              <div>
                <strong>{tt('browser.loadFailed')}</strong>
                <p>{browserError}</p>
              </div>
            </div>
          )}

          <div className={`browser-preview-device browser-preview-device-${device}`}>
            <iframe
              ref={iframeRef}
              className="browser-preview-frame"
              src={validatedUrl || undefined}
              onLoad={onIframeLoad}
              onError={onIframeError}
              sandbox="allow-scripts allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin"
              referrerPolicy="no-referrer"
              title={tt('browser.frameTitle')}
            />
          </div>
        </>
      )}
    </div>
  );
}
