import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useEditor } from '../../store/EditorContext';
import { normalizeBrowserUrl } from '../../features/browserPreview/normalizeBrowserUrl';
import { BrowserPreviewBody } from './BrowserPreviewBody';
import type { BrowserPreviewConsoleEntry } from './BrowserPreviewBody';
import { BrowserPreviewToolbar } from './BrowserPreviewToolbar';
import './BrowserPreview.css';

const PREVIEW_RECENT_URLS_KEY = 'blinkcode-preview-recent-urls';
const PREVIEW_RECENT_URL_LIMIT = 8;

function readRecentPreviewUrls() {
  try {
    const value = JSON.parse(localStorage.getItem(PREVIEW_RECENT_URLS_KEY) || '[]');
    return Array.isArray(value) ? value.filter(item => typeof item === 'string').slice(0, PREVIEW_RECENT_URL_LIMIT) : [];
  } catch {
    return [];
  }
}

function rememberPreviewUrl(url: string) {
  const next = [url, ...readRecentPreviewUrls().filter(item => item !== url)].slice(0, PREVIEW_RECENT_URL_LIMIT);
  try { localStorage.setItem(PREVIEW_RECENT_URLS_KEY, JSON.stringify(next)); } catch {}
  return next;
}

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

  const previewRef = useRef<HTMLElement | null>(null);
  const [addressValue, setAddressValue] = useState(state.browserUrl || '');
  const [history, setHistory] = useState<string[]>(state.browserUrl ? [state.browserUrl] : []);
  const [historyIndex, setHistoryIndex] = useState(state.browserUrl ? 0 : -1);
  const [device, setDevice] = useState<'responsive' | 'mobile' | 'tablet'>('responsive');
  const [consoleEntries, setConsoleEntries] = useState<BrowserPreviewConsoleEntry[]>([]);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [consoleFilter, setConsoleFilter] = useState<'all' | BrowserPreviewConsoleEntry['level']>('all');
  const [recentUrls, setRecentUrls] = useState<string[]>(readRecentPreviewUrls);
  const validatedUrl = useMemo(() => normalizeBrowserUrl(state.browserUrl || ''), [state.browserUrl]);
  const isSupportedUrl = Boolean(validatedUrl);

  const addConsoleEntry = useCallback((level: BrowserPreviewConsoleEntry['level'], message: string, source?: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setConsoleEntries(entries => [...entries.slice(-119), { id: `${Date.now()}:${Math.random()}`, level, message, source, time, url: state.browserUrl || validatedUrl || '' }]);
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
    setRecentUrls(rememberPreviewUrl(url));
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
    const webview = previewRef.current as (HTMLElement & { reload?: () => void }) | null;
    if (webview?.reload) webview.reload();
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

  const copyConsole = useCallback(() => {
    if (!consoleEntries.length) return;
    const text = consoleEntries
      .map(entry => `[${entry.time}] ${entry.level.toUpperCase()} ${entry.message}${entry.source ? ` (${entry.source})` : ''}`)
      .join('\n');
    void navigator.clipboard?.writeText(text);
  }, [consoleEntries]);

  useEffect(() => {
    const webview = previewRef.current;
    if (!webview || !validatedUrl) return undefined;

    const onDidStartLoading = () => {
      setBrowserLoading(true);
      setBrowserError(null);
    };
    const onDidStopLoading = () => {
      setBrowserLoading(false);
    };
    const onDidFinishLoad = () => {
      setBrowserLoading(false);
      setBrowserError(null);
      addConsoleEntry('info', `Loaded: ${validatedUrl}`);
      setRecentUrls(rememberPreviewUrl(validatedUrl));
      setBrowserUrl(validatedUrl);
    };
    const onDidFailLoad = (event: Event) => {
      const detail = event as Event & { errorCode?: number; errorDescription?: string; validatedURL?: string };
      if (detail.errorCode === -3) return;
      setBrowserLoading(false);
      const message = detail.errorDescription || 'Failed to load the requested page in preview.';
      setBrowserError(message);
      addConsoleEntry('error', message, detail.validatedURL || validatedUrl);
    };
    const onDidNavigate = (event: Event) => {
      const detail = event as Event & { url?: string };
      if (detail.url && detail.url !== state.browserUrl) setBrowserUrl(detail.url);
    };
    const onConsoleMessage = (event: Event) => {
      const detail = event as Event & { level?: number; message?: string; line?: number; sourceId?: string };
      const level = detail.level === 3
        ? 'error'
        : detail.level === 2
          ? 'warn'
          : detail.level === 1
            ? 'info'
            : 'log';
      const source = detail.sourceId
        ? `${detail.sourceId}${detail.line ? `:${detail.line}` : ''}`
        : undefined;
      addConsoleEntry(level, detail.message || 'Console message', source);
    };

    webview.addEventListener('did-start-loading', onDidStartLoading);
    webview.addEventListener('did-stop-loading', onDidStopLoading);
    webview.addEventListener('did-finish-load', onDidFinishLoad);
    webview.addEventListener('did-fail-load', onDidFailLoad);
    webview.addEventListener('did-navigate', onDidNavigate);
    webview.addEventListener('did-navigate-in-page', onDidNavigate);
    webview.addEventListener('console-message', onConsoleMessage);

    return () => {
      webview.removeEventListener('did-start-loading', onDidStartLoading);
      webview.removeEventListener('did-stop-loading', onDidStopLoading);
      webview.removeEventListener('did-finish-load', onDidFinishLoad);
      webview.removeEventListener('did-fail-load', onDidFailLoad);
      webview.removeEventListener('did-navigate', onDidNavigate);
      webview.removeEventListener('did-navigate-in-page', onDidNavigate);
      webview.removeEventListener('console-message', onConsoleMessage);
    };
  }, [addConsoleEntry, setBrowserError, setBrowserLoading, setBrowserUrl, state.browserUrl, validatedUrl]);

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
        recentUrls={recentUrls}
        onToggleConsole={() => setConsoleOpen(open => !open)}
        onSelectRecentUrl={url => navigate(url)}
        device={device}
        onDeviceChange={setDevice}
      />
      <BrowserPreviewBody
        previewRef={previewRef}
        browserUrl={state.browserUrl}
        browserError={state.browserError}
        validatedUrl={validatedUrl}
        isSupportedUrl={isSupportedUrl}
        consoleEntries={consoleEntries}
        consoleOpen={consoleOpen}
        consoleFilter={consoleFilter}
        onConsoleFilterChange={setConsoleFilter}
        onClearConsole={() => setConsoleEntries([])}
        onCloseConsole={() => setConsoleOpen(false)}
        onCopyConsole={copyConsole}
        device={device}
      />
    </section>
  );
}
