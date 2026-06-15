import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useEditor } from '../../store/EditorContext';
import { normalizeBrowserUrl } from '../../features/browserPreview/normalizeBrowserUrl';
import { BrowserPreviewBody } from './BrowserPreviewBody';
import { BrowserPreviewToolbar } from './BrowserPreviewToolbar';
import './BrowserPreview.css';

export default function BrowserPreview() {
  const {
    state,
    closeBrowserPreview,
    openBrowserPreview,
    setBrowserUrl,
    setBrowserLoading,
    setBrowserNavState,
    setBrowserError,
  } = useEditor();

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [addressValue, setAddressValue] = useState(state.browserUrl || '');
  const [history, setHistory] = useState<string[]>(state.browserUrl ? [state.browserUrl] : []);
  const [historyIndex, setHistoryIndex] = useState(state.browserUrl ? 0 : -1);
  const [device, setDevice] = useState<'responsive' | 'mobile' | 'tablet'>('responsive');

  useEffect(() => {
    setAddressValue(state.browserUrl || '');
  }, [state.browserUrl]);

  const validatedUrl = useMemo(() => normalizeBrowserUrl(state.browserUrl || ''), [state.browserUrl]);
  const isSupportedUrl = Boolean(validatedUrl);

  useEffect(() => {
    setBrowserNavState(historyIndex > 0, historyIndex >= 0 && historyIndex < history.length - 1);
  }, [history.length, historyIndex, setBrowserNavState]);

  const navigate = (url: string, record = true) => {
    setBrowserError(null);
    if (record) {
      const nextHistory = [...history.slice(0, historyIndex + 1), url];
      setHistory(nextHistory);
      setHistoryIndex(nextHistory.length - 1);
    }
    openBrowserPreview(url);
  };

  const submitAddress = (event: FormEvent) => {
    event.preventDefault();
    const nextUrl = normalizeBrowserUrl(addressValue);
    if (!nextUrl) {
      setBrowserError('Only valid http:// or https:// URLs are allowed in preview.');
      return;
    }

    navigate(nextUrl);
  };

  const openExternal = () => {
    if (!validatedUrl) return;
    const electronApi = (window as any).electronAPI;
    if (electronApi?.openExternal) {
      electronApi.openExternal(validatedUrl).catch(() => {});
      return;
    }
    window.open(validatedUrl, '_blank', 'noopener,noreferrer');
  };

  const handleReload = () => {
    setBrowserLoading(true);
    setBrowserError(null);
    if (iframeRef.current && validatedUrl) {
      iframeRef.current.src = validatedUrl;
    }
  };

  const handleBack = () => {
    if (historyIndex <= 0) return;
    const nextIndex = historyIndex - 1;
    setHistoryIndex(nextIndex);
    navigate(history[nextIndex], false);
  };

  const handleForward = () => {
    if (historyIndex >= history.length - 1) return;
    const nextIndex = historyIndex + 1;
    setHistoryIndex(nextIndex);
    navigate(history[nextIndex], false);
  };

  const handleIframeLoad = () => {
    setBrowserLoading(false);
    setBrowserError(null);
    if (validatedUrl) setBrowserUrl(validatedUrl);
  };

  const handleIframeError = () => {
    setBrowserLoading(false);
    setBrowserError('Failed to load the requested page in iframe preview.');
  };

  return (
    <section className="browser-preview">
      <BrowserPreviewToolbar
        addressValue={addressValue}
        canGoBack={state.browserCanGoBack}
        canGoForward={state.browserCanGoForward}
        isLoading={state.browserLoading}
        isSupportedUrl={isSupportedUrl}
        onAddressChange={setAddressValue}
        onSubmitAddress={submitAddress}
        onBack={handleBack}
        onForward={handleForward}
        onReload={handleReload}
        onOpenExternal={openExternal}
        onClose={closeBrowserPreview}
        device={device}
        onDeviceChange={setDevice}
      />
      <BrowserPreviewBody
        iframeRef={iframeRef}
        browserUrl={state.browserUrl}
        browserError={state.browserError}
        validatedUrl={validatedUrl}
        isSupportedUrl={isSupportedUrl}
        onIframeLoad={handleIframeLoad}
        onIframeError={handleIframeError}
        device={device}
      />
    </section>
  );
}
