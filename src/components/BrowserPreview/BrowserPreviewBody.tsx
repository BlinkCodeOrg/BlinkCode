import type { RefObject } from 'react';
import { AlertTriangle, CheckCircle2, Circle, CircleAlert, Clipboard, Globe, ShieldAlert, Trash2, X } from 'lucide-react';
import { useT } from '../../hooks/useT';

export interface BrowserPreviewConsoleEntry {
  id: string;
  level: 'error' | 'info' | 'log' | 'warn';
  message: string;
  time: string;
  source?: string;
  url?: string;
}

type BrowserPreviewBodyProps = {
  previewRef: RefObject<HTMLElement | null>;
  browserUrl: string | null;
  browserError: string | null;
  validatedUrl: string | null;
  isSupportedUrl: boolean;
  consoleEntries: BrowserPreviewConsoleEntry[];
  consoleOpen: boolean;
  consoleFilter: 'all' | BrowserPreviewConsoleEntry['level'];
  onConsoleFilterChange: (filter: 'all' | BrowserPreviewConsoleEntry['level']) => void;
  onClearConsole: () => void;
  onCloseConsole: () => void;
  onCopyConsole: () => void;
  device: 'responsive' | 'mobile' | 'tablet';
};

export function BrowserPreviewBody({
  previewRef,
  browserUrl,
  browserError,
  validatedUrl,
  isSupportedUrl,
  consoleEntries,
  consoleOpen,
  consoleFilter,
  onConsoleFilterChange,
  onClearConsole,
  onCloseConsole,
  onCopyConsole,
  device,
}: BrowserPreviewBodyProps) {
  const tt = useT();
  const visibleEntries = consoleFilter === 'all'
    ? consoleEntries
    : consoleEntries.filter(entry => entry.level === consoleFilter);
  const counts = {
    all: consoleEntries.length,
    error: consoleEntries.filter(entry => entry.level === 'error').length,
    warn: consoleEntries.filter(entry => entry.level === 'warn').length,
    log: consoleEntries.filter(entry => entry.level === 'log').length,
    info: consoleEntries.filter(entry => entry.level === 'info').length,
  };

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
            <webview
              ref={previewRef}
              className="browser-preview-frame"
              src={validatedUrl || undefined}
              allowpopups
              webpreferences="contextIsolation=yes, nodeIntegration=no, sandbox=yes"
              title={tt('browser.frameTitle')}
            />
          </div>
          {consoleOpen && <aside className="browser-preview-console" aria-label={tt('browser.console')}>
            <div className="browser-preview-console-head">
              <div>
                <span>{tt('browser.console')}</span>
                <small>{tt('browser.consoleHint')}</small>
              </div>
              <div className="browser-preview-console-actions">
                <button type="button" onClick={onCopyConsole} disabled={consoleEntries.length === 0} title={tt('common.copy')}>
                  <Clipboard size={13} />
                </button>
                <button type="button" onClick={onClearConsole} disabled={consoleEntries.length === 0} title={tt('common.clear')}>
                  <Trash2 size={13} />
                </button>
                <button type="button" onClick={onCloseConsole} title={tt('common.close')}>
                  <X size={13} />
                </button>
              </div>
            </div>
            <div className="browser-preview-console-filters">
              {([
                ['all', tt('browser.consoleAll'), counts.all],
                ['error', tt('browser.consoleErrors'), counts.error],
                ['warn', tt('browser.consoleWarnings'), counts.warn],
                ['log', tt('browser.consoleLogs'), counts.log],
                ['info', tt('browser.consoleInfo'), counts.info],
              ] as const).map(([filter, label, count]) => (
                <button
                  key={filter}
                  type="button"
                  className={consoleFilter === filter ? 'active' : ''}
                  onClick={() => onConsoleFilterChange(filter)}
                >
                  {label}<span>{count}</span>
                </button>
              ))}
            </div>
            <div className="browser-preview-console-list">
              {visibleEntries.length === 0 && (
                <div className="browser-preview-console-empty">
                  <CheckCircle2 size={13} />
                  <span>{consoleEntries.length === 0 ? tt('browser.consoleEmpty') : tt('browser.consoleNoMatches')}</span>
                </div>
              )}
              {visibleEntries.slice(-60).map(entry => (
                <div className={`browser-preview-console-entry ${entry.level}`} key={entry.id}>
                  {entry.level === 'error' ? <CircleAlert size={13} /> : entry.level === 'warn' ? <AlertTriangle size={13} /> : <Circle size={12} />}
                  <div>
                    <strong>{entry.level}</strong>
                    <span>{entry.message}</span>
                    {entry.source && <small>{entry.source}</small>}
                    {entry.url && <small>{entry.url}</small>}
                  </div>
                  <time>{entry.time}</time>
                </div>
              ))}
            </div>
          </aside>}
        </>
      )}
    </div>
  );
}
