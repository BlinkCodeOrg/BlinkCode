import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useEditor } from '../../store/EditorContext';
import { normalizeBrowserUrl } from '../../features/browserPreview/normalizeBrowserUrl';
import { BrowserPreviewBody } from './BrowserPreviewBody';
import type { BrowserPreviewConsoleEntry } from './BrowserPreviewBody';
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
  const [consoleEntries, setConsoleEntries] = useState<BrowserPreviewConsoleEntry[]>([]);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [consoleFilter, setConsoleFilter] = useState<'all' | BrowserPreviewConsoleEntry['level']>('all');
  const validatedUrl = useMemo(() => normalizeBrowserUrl(state.browserUrl || ''), [state.browserUrl]);
  const isSupportedUrl = Boolean(validatedUrl);

  const addConsoleEntry = useCallback((level: BrowserPreviewConsoleEntry['level'], message: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setConsoleEntries(entries => [...entries.slice(-59), { id: `${Date.now()}:${Math.random()}`, level, message, time, url: state.browserUrl || validatedUrl || '' }]);
    if (level === 'error' || level === 'warn') setConsoleOpen(true);
  }, [state.browserUrl, validatedUrl]);

  const consoleProblemCount = useMemo(
    () => consoleEntries.filter(entry => entry.level === 'error' || entry.level === 'warn').length,
    [consoleEntries],
  );

  useEffect(() => {
    setAddressValue(state.browserUrl || '');
  }, [state.browserUrl]);

  useEffect(() => {
    setBrowserNavState(historyIndex > 0, historyIndex >= 0 && historyIndex < history.length - 1);
  }, [history.length, historyIndex, setBrowserNavState]);

  const navigate = (url: string, record = true) => {
    setBrowserError(null);
    addConsoleEntry('info', `Navigate: ${url}`);
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
    addConsoleEntry('info', `Reload: ${validatedUrl || state.browserUrl || ''}`);
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
    addConsoleEntry('info', `Loaded: ${validatedUrl || state.browserUrl || ''}`);
    if (validatedUrl) setBrowserUrl(validatedUrl);
  };

  const handleIframeError = () => {
    setBrowserLoading(false);
    const message = 'Failed to load the requested page in iframe preview.';
    setBrowserError(message);
    addConsoleEntry('error', message);
  };

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;
      if (data.source !== 'blinkcode-preview-console') return;
      const level = data.level === 'error' || data.level === 'warn' ? data.level : 'info';
      addConsoleEntry(level, String(data.message || 'Preview message'));
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [addConsoleEntry]);

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
        consoleOpen={consoleOpen}
        consoleCount={consoleEntries.length}
        consoleProblemCount={consoleProblemCount}
        onToggleConsole={() => setConsoleOpen(open => !open)}
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
        consoleEntries={consoleEntries}
        consoleOpen={consoleOpen}
        consoleFilter={consoleFilter}
        onConsoleFilterChange={setConsoleFilter}
        onClearConsole={() => setConsoleEntries([])}
        onCloseConsole={() => setConsoleOpen(false)}
        device={device}
      />
    </section>
  );
}
