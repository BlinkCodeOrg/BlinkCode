import { useEffect, useState } from 'react';
import { Button } from '../ui/Button';

type UpdateStatus = { status: string; version?: string; releaseNotes?: string; percent?: number; error?: string };

export default function SettingsUpdatesSection({ tt }: { tt: (key: string, args?: Record<string, string | number>) => string }) {
  const [status, setStatus] = useState<UpdateStatus>({ status: 'idle' });
  useEffect(() => window.electronAPI?.onUpdateStatus?.(setStatus), []);
  if (!window.electronAPI?.checkForUpdates) return null;

  const check = async () => {
    setStatus({ status: 'checking' });
    try { setStatus(await window.electronAPI!.checkForUpdates!()); }
    catch (error) { setStatus({ status: 'error', error: error instanceof Error ? error.message : String(error) }); }
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
            {status.error && <div className="settings-row-desc">{status.error}</div>}
          </div>
        </div>
        <div className="settings-row-control">
          {status.status === 'ready'
            ? <Button variant="primary" onClick={() => window.electronAPI?.installUpdate?.()}>{tt('updates.restart')}</Button>
            : <Button disabled={status.status === 'checking' || status.status === 'downloading'} onClick={check}>{tt('updates.check')}</Button>}
        </div>
      </div>
    </div>
  );
}
