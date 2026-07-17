import { useState, type MouseEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpCircle, Download, RefreshCw } from 'lucide-react';
import { useAppUpdates } from '../providers/AppUpdatesProvider';
import { useEditor } from '../../store/EditorContext';
import { Switch } from '../ui/Switch';
import { useT } from '../../hooks/useT';

export function UpdateBanner() {
  const [hovered, setHovered] = useState(false);
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
  const hasUpdate =
    updateStatus?.availableUpdate !== null &&
    updateStatus?.availableUpdate !== undefined;
  const downloadFailed = updateStatus?.phase === 'download-error';

  if (!hasUpdate && !downloaded && !isDownloadingUpdate && !isInstallingUpdate)
    return null;

  const click = (event: MouseEvent<HTMLButtonElement>) => {
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
      <RefreshCw size={14} className="update-banner-spin" />
    ) : downloaded ? (
      <ArrowUpCircle size={14} />
    ) : (
      <Download size={14} />
    );

  return (
    <AnimatePresence>
      <motion.div
        key="update-banner"
        initial={{ opacity: 0, height: 0, marginTop: 0 }}
        animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
        exit={{ opacity: 0, height: 0, marginTop: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="update-banner-wrap"
      >
        <div
          className="update-banner"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <div className="update-banner-header">
            {tt('updates.bannerTitle')}
          </div>
          <AnimatePresence>
            {hovered && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{
                  duration: 0.3,
                  ease: [0.22, 1, 0.36, 1],
                  opacity: { duration: 0.2 },
                }}
                className="update-banner-expanded"
              >
                <div className="update-banner-divider" />
                <motion.div
                  initial={{ y: 6, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.05, duration: 0.25 }}
                  className="update-banner-content"
                >
                  <div className="update-banner-setting">
                    <span>{tt('updates.autoUpdate')}</span>
                    <Switch
                      ariaLabel={tt('updates.autoUpdate')}
                      value={state.settings.autoUpdate}
                      onChange={(autoUpdate) => updateSettings({ autoUpdate })}
                    />
                  </div>
                  <button
                    className="update-banner-action"
                    onClick={click}
                    disabled={
                      (isInstallingUpdate || isDownloadingUpdate) &&
                      !downloadFailed
                    }
                  >
                    {icon}
                    {buttonText}
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
