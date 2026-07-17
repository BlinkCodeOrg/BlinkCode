import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpCircle,
  CheckCircle2,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { useAppUpdates } from '../providers/AppUpdatesProvider';
import { useEditor } from '../../store/EditorContext';
import { formatReleaseNotes } from '../../features/updates/formatReleaseNotes';
import { useAppVersion } from '../../features/appVersion/useAppVersion';

export default function SettingsUpdatesSection({
  tt,
}: {
  tt: (key: string, args?: Record<string, string | number>) => string;
}) {
  const { state, updateSettings } = useEditor();
  const {
    updateStatus,
    isCheckingForUpdates,
    isDownloadingUpdate,
    isInstallingUpdate,
    isAutoUpdateSupported,
    checkForUpdates,
    downloadUpdate,
    installUpdate,
  } = useAppUpdates();
  const currentVersion = useAppVersion();

  const downloaded = updateStatus?.updateDownloaded === true;
  const hasUpdate = Boolean(updateStatus?.availableUpdate);
  const failed = updateStatus?.phase === 'download-error';
  const progress = updateStatus?.downloadProgress?.percent ?? 0;
  const availableVersion = updateStatus?.availableUpdate?.version ?? '';
  const notes = formatReleaseNotes(updateStatus?.availableUpdate?.releaseNotes);
  const upToDate = updateStatus?.phase === 'not-available';

  const status = isCheckingForUpdates ? (
    <>
      <RefreshCw size={16} className="update-spin" />{' '}
      {tt('updates.status.checking')}
    </>
  ) : failed ? (
    <>
      <XCircle size={16} />{' '}
      {tt('updates.downloadFailedVersion', { version: availableVersion })}
    </>
  ) : isDownloadingUpdate ? (
    <>
      <ArrowDownToLine size={16} />{' '}
      {tt('updates.downloadingVersion', { version: availableVersion })}
    </>
  ) : downloaded ? (
    <>
      <CheckCircle2 size={16} />{' '}
      {tt('updates.downloadedVersion', { version: availableVersion })}
    </>
  ) : hasUpdate ? (
    <>
      <AlertCircle size={16} />{' '}
      {tt('updates.availableVersion', { version: availableVersion })}
    </>
  ) : upToDate ? (
    <>
      <CheckCircle2 size={16} /> {tt('updates.upToDate')}
    </>
  ) : (
    <>{tt('updates.prompt')}</>
  );

  const action = isInstallingUpdate ? (
    <Button disabled>
      <RefreshCw size={14} className="update-spin" /> {tt('updates.installing')}
    </Button>
  ) : isDownloadingUpdate ? (
    <Button disabled>
      <RefreshCw size={14} className="update-spin" />{' '}
      {tt('updates.downloading')}
    </Button>
  ) : failed ? (
    <Button variant="primary" onClick={() => void downloadUpdate()}>
      <RefreshCw size={14} /> {tt('updates.retry')}
    </Button>
  ) : downloaded ? (
    <Button variant="primary" onClick={() => void installUpdate()}>
      <ArrowUpCircle size={14} /> {tt('updates.install')}
    </Button>
  ) : hasUpdate && isAutoUpdateSupported ? (
    <Button variant="primary" onClick={() => void downloadUpdate()}>
      <ArrowDownToLine size={14} /> {tt('updates.download')}
    </Button>
  ) : (
    <Button
      disabled={isCheckingForUpdates}
      onClick={() => void checkForUpdates()}
    >
      <RefreshCw size={14} /> {upToDate ? 'Check Again' : 'Check for Updates'}
    </Button>
  );

  return (
    <div
      className="settings-section settings-update-card"
      data-testid="settings-updates"
    >
      <div className="settings-section-title">{tt('updates.title')}</div>
      <div className="settings-update-version">
        {tt('updates.currentVersion', { version: currentVersion })}
      </div>
      <div className="settings-row">
        <div className="settings-row-label">
          <div>
            <div className="settings-row-name">{tt('updates.autoUpdate')}</div>
            <div className="settings-row-desc">
              {tt('updates.autoUpdateDescription')}
            </div>
          </div>
        </div>
        <div className="settings-row-control">
          <Switch
            ariaLabel={tt('updates.autoUpdate')}
            disabled={!isAutoUpdateSupported}
            value={state.settings.autoUpdate}
            onChange={(autoUpdate) => updateSettings({ autoUpdate })}
          />
        </div>
      </div>
      <div
        className={`settings-update-status${failed ? ' error' : ''}${downloaded || upToDate ? ' success' : ''}`}
      >
        <div className="settings-update-status-line">
          <span>{status}</span>
          {action}
        </div>
        {isDownloadingUpdate && (
          <>
            <div className="settings-update-progress">
              <span
                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
              />
            </div>
            <div className="settings-update-percent">
              {Math.round(progress)}%
            </div>
          </>
        )}
        {notes && <pre className="settings-update-notes">{notes}</pre>}
        {(updateStatus?.errorKey || updateStatus?.error) && (
          <div className="settings-row-desc">
            {updateStatus.errorKey
              ? tt(updateStatus.errorKey)
              : updateStatus.error}
          </div>
        )}
      </div>
      {!isAutoUpdateSupported && (
        <div className="settings-update-warning">
          <AlertCircle size={15} /> {tt('updates.unsupported')}
        </div>
      )}
    </div>
  );
}
