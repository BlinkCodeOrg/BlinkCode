import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Download, Loader2, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { useT } from '../../hooks/useT';

type UpdateStatus = {
  status: string;
  version?: string;
  releaseNotes?: string;
  percent?: number;
  error?: string;
  errorKey?: string;
  releaseUrl?: string;
  manualDownloadUrl?: string;
};

const HIDDEN_STATUSES = new Set(['idle', 'current', 'checked', 'development']);
const VISIBLE_STATUSES = new Set(['available', 'manual', 'downloading', 'ready', 'error']);
const AUTO_OPEN_STATUSES = new Set(['available', 'manual', 'downloading', 'ready']);

function compactErrorMessage(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error || '');
  return raw.split('\n')[0].replace(/^Error invoking remote method '[^']+':\s*/i, '');
}

function formatPercent(percent?: number) {
  if (typeof percent !== 'number' || !Number.isFinite(percent)) return '';
  return `${Math.max(0, Math.min(100, Math.round(percent)))}%`;
}

export function UpdateIndicator() {
  const tt = useT();
  const ref = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<UpdateStatus>({ status: 'idle' });

  useEffect(() => {
    const api = window.electronAPI;
    if (!api?.onUpdateStatus) return undefined;
    return api.onUpdateStatus(next => {
      setStatus(next);
      if (AUTO_OPEN_STATUSES.has(next.status)) setOpen(true);
    });
  }, []);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api?.checkForUpdates) return undefined;

    const timer = window.setTimeout(async () => {
      setChecking(true);
      try {
        const next = await api.checkForUpdates?.();
        if (next && !HIDDEN_STATUSES.has(next.status)) setStatus(next);
      } catch (error) {
        setStatus({ status: 'error', errorKey: 'updates.errorUnknown', error: compactErrorMessage(error) });
      } finally {
        setChecking(false);
      }
    }, 3500);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event: MouseEvent) => {
      if (ref.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, [open]);

  const visible = useMemo(
    () => VISIBLE_STATUSES.has(status.status) || (checking && open),
    [checking, open, status.status],
  );

  if (!window.electronAPI?.checkForUpdates || !visible) return null;

  const isAvailable = status.status === 'available';
  const isManual = status.status === 'manual';
  const isDownloading = status.status === 'downloading';
  const isReady = status.status === 'ready';
  const isError = status.status === 'error';
  const progress = formatPercent(status.percent);
  const errorMessage = status.errorKey ? tt(status.errorKey) : (status.error || tt('updates.errorMessage'));

  const download = async () => {
    try {
      const next = await window.electronAPI?.downloadUpdate?.();
      if (next) setStatus(next);
    } catch (error) {
      setStatus({ status: 'error', errorKey: 'updates.errorUnknown', error: compactErrorMessage(error) });
    }
  };

  const install = () => {
    void window.electronAPI?.installUpdate?.();
  };

  const openManualDownload = () => {
    const url = status.manualDownloadUrl || status.releaseUrl;
    if (!url) return;
    void window.electronAPI?.openExternal?.(url);
  };

  return (
    <div className="update-indicator" ref={ref}>
      <button
        className={`header-btn update-indicator-button ${isReady ? 'ready' : ''} ${isError ? 'error' : ''}`}
        onClick={() => setOpen(value => !value)}
        title={tt('updates.topTitle')}
      >
        {isDownloading ? <Loader2 size={14} className="update-spin" /> : isError ? <AlertCircle size={14} /> : <Download size={14} />}
        <span>{isReady ? tt('updates.installShort') : tt('updates.updateShort')}</span>
      </button>

      {open && (
        <div className="update-popover">
          <div className="update-popover-head">
            <div className="update-popover-icon">
              {isReady ? <CheckCircle2 size={17} /> : isError ? <AlertCircle size={17} /> : <Download size={17} />}
            </div>
            <div>
              <div className="update-popover-title">{tt(`updates.status.${status.status}`)}</div>
              {status.version && <div className="update-popover-subtitle">{tt('updates.version', { version: status.version })}</div>}
            </div>
            <button className="update-popover-close" onClick={() => setOpen(false)} title={tt('common.close')}>
              <X size={14} />
            </button>
          </div>

          <div className="update-popover-body">
            {isAvailable && <p>{tt('updates.confirmMessage')}</p>}
            {isManual && <p>{tt('updates.manualMessage')}</p>}
            {isDownloading && <p>{tt('updates.downloadingMessage', { percent: progress || 0 })}</p>}
            {isReady && <p>{tt('updates.readyMessage')}</p>}
            {isError && <p>{errorMessage}</p>}
            {status.releaseNotes && <pre className="update-release-notes">{status.releaseNotes}</pre>}
          </div>

          <div className="update-popover-actions">
            <Button variant="ghost" onClick={() => setOpen(false)}>{tt('common.later')}</Button>
            {isAvailable && <Button variant="primary" onClick={download}>{tt('updates.downloadAndInstall')}</Button>}
            {isManual && <Button variant="primary" onClick={openManualDownload}>{tt(status.manualDownloadUrl ? 'updates.downloadFromGitHub' : 'updates.openRelease')}</Button>}
            {isReady && <Button variant="primary" onClick={install}>{tt('updates.restart')}</Button>}
          </div>
        </div>
      )}
    </div>
  );
}
