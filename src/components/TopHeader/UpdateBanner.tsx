import { useState, type MouseEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpCircle, Download, RefreshCw } from 'lucide-react';
import { useAppUpdates } from '../providers/AppUpdatesProvider';
import { useEditor } from '../../store/EditorContext';
import { Switch } from '../ui/Switch';
import { useT } from '../../hooks/useT';

export function UpdateBanner() {
  const [expanded, setExpanded] = useState(false);
  const tt = useT();
  const { state, updateSettings } = useEditor();
  const {
    updateStatus,
    isDownloadingUpdate,
    isInstallingUpdate,
    downloadUpdate,
    installUpdate,
  } = useAppUpdates();
  const downloaded = updateStatus?.updateDownloaded === true;
  const hasUpdate = updateStatus?.availableUpdate != null;
  const downloadFailed = updateStatus?.phase === 'download-error';

  if (!hasUpdate && !downloaded && !isDownloadingUpdate && !isInstallingUpdate)
    return null;

  const runUpdate = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (downloaded) void installUpdate();
    else if (hasUpdate && !isDownloadingUpdate) void downloadUpdate();
  };
  const buttonText = isInstallingUpdate
    ? tt('updates.installing')
    : isDownloadingUpdate
      ? tt('updates.downloading')
      : downloaded
        ? tt('updates.install')
        : downloadFailed
          ? tt('updates.retry')
          : tt('updates.download');
  const icon =
    isInstallingUpdate || isDownloadingUpdate ? (
      <RefreshCw size={13} className="top-update-spin" />
    ) : downloaded ? (
      <ArrowUpCircle size={13} />
    ) : (
      <Download size={13} />
    );

  return (
    <motion.div
      className="top-update-banner"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <button
        type="button"
        className="top-update-pill"
        aria-expanded={expanded}
        aria-haspopup="dialog"
        onClick={() => setExpanded((current) => !current)}
      >
        {icon}
        <span>{tt('updates.bannerTitle')}</span>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="top-update-popover"
            role="dialog"
            aria-label={tt('updates.bannerTitle')}
            initial={{ opacity: 0, y: -5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
          >
            <div className="top-update-popover-title">
              {tt('updates.bannerTitle')}
            </div>
            <div className="top-update-setting">
              <span>{tt('updates.autoUpdate')}</span>
              <Switch
                ariaLabel={tt('updates.autoUpdate')}
                value={state.settings.autoUpdate}
                onChange={(autoUpdate) => updateSettings({ autoUpdate })}
              />
            </div>
            <button
              type="button"
              className="top-update-action"
              onClick={runUpdate}
              disabled={
                (isInstallingUpdate || isDownloadingUpdate) && !downloadFailed
              }
            >
              {icon}
              {buttonText}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
