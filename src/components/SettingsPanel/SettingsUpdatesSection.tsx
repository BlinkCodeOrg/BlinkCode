import { useEffect, useState } from 'react';
import { Button } from '../ui/Button';

type UpdateStatus = { status: string; version?: string; releaseNotes?: string; percent?: number; error?: string; errorKey?: string; releaseUrl?: string; manualDownloadUrl?: string };

export default function SettingsUpdatesSection({ tt }: { tt: (key: string, args?: Record<string, string | number>) => string }) {
  const [status, setStatus] = useState<UpdateStatus>({ status: 'idle' });
  useEffect(() => window.electronAPI?.onUpdateStatus?.(setStatus), []);
  if (!window.electronAPI?.checkForUpdates) return null;

  const check = async () => {
    setStatus({ status: 'checking' });
    try { setStatus(await window.electronAPI!.checkForUpdates!()); }
    catch (error) { setStatus({ status: 'error', errorKey: 'updates.errorUnknown', error: error instanceof Error ? error.message : String(error) }); }
  };

  const download = async () => {
    setStatus({ ...status, status: 'downloading' });
    try {
      const next = await window.electronAPI?.downloadUpdate?.();
      if (next) setStatus(next);
    } catch (error) {
      setStatus({ status: 'error', errorKey: 'updates.errorUnknown', error: error instanceof Error ? error.message : String(error) });
    }
  };

  const openManualDownload = () => {
    const url = status.manualDownloadUrl || status.releaseUrl;
    if (!url) return;
    void window.electronAPI?.openExternal?.(url);
  };

  return (
    <div className="settings-section" data-testid="settings-updates">
      <div className="settings-section-title">{tt('updates.title')}</div>
      <div className="settings-section-desc">{tt('updates.description')}</div>
      <div className="settings-row">
        <div className="settings-row-label">
          <div>
            <div className="settings-row-name">{tt(`updates.status.${status.status}`)}</div>
            {status.version && <div className="settings-row-desc">{tt('updates.version', { version: status.version })}</div>}
            {status.releaseNotes && <div className="settings-row-desc">{status.releaseNotes}</div>}
            {(status.errorKey || status.error) && <div className="settings-row-desc">{status.errorKey ? tt(status.errorKey) : status.error}</div>}
          </div>
        </div>
        <div className="settings-row-control">
          {status.status === 'ready'
            ? <Button variant="primary" onClick={() => window.electronAPI?.installUpdate?.()}>{tt('updates.restart')}</Button>
            : status.status === 'manual'
              ? <Button variant="primary" onClick={openManualDownload}>{tt(status.manualDownloadUrl ? 'updates.downloadFromGitHub' : 'updates.openRelease')}</Button>
            : status.status === 'available'
              ? <Button variant="primary" onClick={download}>{tt('updates.downloadAndInstall')}</Button>
            : <Button disabled={status.status === 'checking' || status.status === 'downloading'} onClick={check}>{tt('updates.check')}</Button>}
        </div>
      </div>
    </div>
  );
}
