import fs from 'node:fs';
import path from 'node:path';
import { resolveAutoUpdater } from './resolveAutoUpdater.mjs';

const CHECK_INTERVAL_MS = 15 * 60 * 1000;
const INITIAL_CHECK_DELAY_MS = 3500;
const SUPPORTED_PLATFORMS = new Set(['win32', 'darwin', 'linux']);

const emptyStatus = (phase = 'idle') => ({
  phase,
  availableUpdate: null,
  downloadProgress: null,
  updateDownloaded: false,
  error: null,
  errorKey: null,
});

function compactError(error) {
  const raw = error instanceof Error ? error.message : String(error || '');
  if (/404|Cannot find latest|No published versions|ENOENT/i.test(raw))
    return { errorKey: 'updates.errorMissingFiles', error: null };
  if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|network|fetch|ERR_INTERNET/i.test(raw))
    return { errorKey: 'updates.errorNetwork', error: null };
  return {
    errorKey: 'updates.errorUnknown',
    error: raw.split('\n')[0] || 'Unknown updater error',
  };
}

function updateInfo(info) {
  if (!info) return null;
  const notes = Array.isArray(info.releaseNotes)
    ? info.releaseNotes
        .map((note) => (typeof note === 'string' ? note : note?.note || ''))
        .filter(Boolean)
        .join('\n')
    : typeof info.releaseNotes === 'string'
      ? info.releaseNotes
      : '';
  return {
    version: String(info.version || ''),
    releaseDate: info.releaseDate,
    releaseName: info.releaseName,
    releaseNotes: notes,
  };
}

function updaterSupported(app, mockEnabled) {
  if (mockEnabled) return true;
  if (
    !app.isPackaged ||
    process.env.FLATPAK_ID ||
    !SUPPORTED_PLATFORMS.has(process.platform)
  )
    return false;
  if (process.platform === 'linux') return Boolean(process.env.APPIMAGE);
  if (process.platform === 'win32') {
    if (process.env.PORTABLE_EXECUTABLE_DIR) return false;
    return !app
      .getPath('exe')
      .toLowerCase()
      .includes(`${path.sep}win-unpacked${path.sep}`.toLowerCase());
  }
  return true;
}

function updateMarker(app) {
  const markerPath = path.join(app.getPath('userData'), 'pending-update.json');
  return {
    mark() {
      fs.mkdirSync(path.dirname(markerPath), { recursive: true });
      fs.writeFileSync(
        markerPath,
        JSON.stringify({ fromVersion: app.getVersion() }),
        'utf8',
      );
    },
    consume() {
      try {
        const value = JSON.parse(fs.readFileSync(markerPath, 'utf8'));
        fs.rmSync(markerPath, { force: true });
        return (
          typeof value?.fromVersion === 'string' &&
          value.fromVersion !== app.getVersion()
        );
      } catch {
        return false;
      }
    },
  };
}

export async function registerUpdaterIpc({ app, ipcMain, send }) {
  const channels = [
    'updates:is-auto-update-supported',
    'updates:get-update-status',
    'updates:check-for-updates',
    'updates:download-update',
    'updates:install-update',
    'updates:has-updated',
    'updates:set-auto-update',
    'updates:set-mock-state',
    'update:check',
    'update:download',
    'update:install',
  ];
  channels.forEach((channel) => ipcMain.removeHandler?.(channel));

  const mockEnabled =
    !app.isPackaged && process.env.BLINKCODE_UPDATE_MOCK === '1';
  const supported = () => updaterSupported(app, mockEnabled);
  const marker = updateMarker(app);
  const hasUpdated = marker.consume();
  let status = emptyStatus(
    hasUpdated ? 'updated' : app.isPackaged ? 'idle' : 'development',
  );
  let autoUpdater = null;
  let checkPromise = null;
  let downloadPromise = null;
  let installing = false;
  let timer = null;
  let mockTimer = null;

  const publish = (patch) => {
    status = { ...status, ...patch };
    send('updates:on-update-status-changed', status);
    send('update:status', status);
    return status;
  };

  const setMockState = (state) => {
    if (!mockEnabled) return false;
    if (mockTimer) clearInterval(mockTimer);
    mockTimer = null;
    const availableUpdate = {
      version: '99.0.0',
      releaseNotes: 'Development-only updater mock.',
    };
    if (state === 'not-available') publish(emptyStatus('not-available'));
    else if (state === 'download-error')
      publish({
        ...emptyStatus('download-error'),
        availableUpdate,
        errorKey: 'updates.errorNetwork',
      });
    else if (state === 'downloaded')
      publish({
        ...emptyStatus('downloaded'),
        availableUpdate,
        updateDownloaded: true,
      });
    else if (state === 'installing')
      publish({
        ...emptyStatus('installing'),
        availableUpdate,
        updateDownloaded: true,
      });
    else if (state === 'downloading')
      publish({
        ...emptyStatus('downloading'),
        availableUpdate,
        downloadProgress: {
          bytesPerSecond: 0,
          percent: 0,
          total: 100,
          transferred: 0,
        },
      });
    else publish({ ...emptyStatus('available'), availableUpdate });
    return true;
  };

  if (supported() && !mockEnabled) {
    autoUpdater = resolveAutoUpdater(await import('electron-updater'));
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = false;
    autoUpdater.on('checking-for-update', () =>
      publish({ phase: 'checking', error: null, errorKey: null }),
    );
    autoUpdater.on('update-available', (info) =>
      publish({
        phase: 'available',
        availableUpdate: updateInfo(info),
        error: null,
        errorKey: null,
      }),
    );
    autoUpdater.on('update-not-available', () =>
      publish(emptyStatus('not-available')),
    );
    autoUpdater.on('download-progress', (progress) =>
      publish({
        phase: 'downloading',
        error: null,
        errorKey: null,
        downloadProgress: {
          bytesPerSecond: progress.bytesPerSecond || 0,
          percent: progress.percent || 0,
          total: progress.total || 0,
          transferred: progress.transferred || 0,
        },
      }),
    );
    autoUpdater.on('update-downloaded', (info) =>
      publish({
        phase: 'downloaded',
        availableUpdate: updateInfo(info) || status.availableUpdate,
        downloadProgress: null,
        updateDownloaded: true,
        error: null,
        errorKey: null,
      }),
    );
    autoUpdater.on('error', (error) =>
      publish({
        phase: status.phase === 'downloading' ? 'download-error' : 'idle',
        downloadProgress: null,
        ...compactError(error),
      }),
    );
  }

  const checkForUpdates = async () => {
    if (!supported())
      return publish(
        emptyStatus(app.isPackaged ? 'unsupported' : 'development'),
      );
    if (checkPromise || downloadPromise || installing) return status;
    if (mockEnabled) {
      publish(emptyStatus('checking'));
      checkPromise = new Promise((resolve) => setTimeout(resolve, 450))
        .then(() => setMockState('available'))
        .finally(() => {
          checkPromise = null;
        });
    } else {
      checkPromise = autoUpdater
        .checkForUpdates()
        .catch((error) =>
          publish({ ...status, phase: 'idle', ...compactError(error) }),
        )
        .finally(() => {
          checkPromise = null;
        });
    }
    await checkPromise;
    return status;
  };

  const downloadUpdate = async () => {
    if (
      !supported() ||
      installing ||
      downloadPromise ||
      checkPromise ||
      !status.availableUpdate ||
      status.updateDownloaded ||
      (autoUpdater?.autoDownload && status.phase === 'available')
    )
      return false;
    if (mockEnabled) {
      setMockState('downloading');
      downloadPromise = new Promise((resolve) => {
        let percent = 0;
        mockTimer = setInterval(() => {
          percent = Math.min(100, percent + 5);
          publish({
            phase: 'downloading',
            downloadProgress: {
              bytesPerSecond: 1024000,
              percent,
              total: 100,
              transferred: percent,
            },
          });
          if (percent === 100) {
            clearInterval(mockTimer);
            mockTimer = null;
            publish({
              phase: 'downloaded',
              downloadProgress: null,
              updateDownloaded: true,
            });
            resolve(true);
          }
        }, 80);
      }).finally(() => {
        downloadPromise = null;
      });
      return downloadPromise;
    }
    publish({
      phase: 'downloading',
      downloadProgress: {
        bytesPerSecond: 0,
        percent: 0,
        total: 0,
        transferred: 0,
      },
      error: null,
      errorKey: null,
    });
    downloadPromise = autoUpdater
      .downloadUpdate()
      .then(() => true)
      .catch((error) => {
        publish({
          phase: 'download-error',
          downloadProgress: null,
          ...compactError(error),
        });
        return false;
      })
      .finally(() => {
        downloadPromise = null;
      });
    return downloadPromise;
  };

  const installUpdate = () => {
    if (!supported() || installing || !status.updateDownloaded) return false;
    installing = true;
    publish({ phase: 'installing' });
    if (mockEnabled) return true;
    try {
      marker.mark();
      autoUpdater.quitAndInstall(false, true);
      return true;
    } catch (error) {
      installing = false;
      publish({ phase: 'downloaded', ...compactError(error) });
      return false;
    }
  };

  ipcMain.handle('updates:is-auto-update-supported', supported);
  ipcMain.handle('updates:get-update-status', () => status);
  ipcMain.handle('updates:check-for-updates', checkForUpdates);
  ipcMain.handle('updates:download-update', downloadUpdate);
  ipcMain.handle('updates:install-update', installUpdate);
  ipcMain.handle('updates:has-updated', () => hasUpdated);
  ipcMain.handle('updates:set-auto-update', (_event, enabled) => {
    const value = enabled === true;
    if (autoUpdater) autoUpdater.autoDownload = value && supported();
    if (value && status.phase === 'available') void downloadUpdate();
    return value;
  });
  ipcMain.handle('updates:set-mock-state', (_event, state) =>
    setMockState(state),
  );
  ipcMain.handle('update:check', checkForUpdates);
  ipcMain.handle('update:download', downloadUpdate);
  ipcMain.handle('update:install', installUpdate);

  if (supported())
    timer = setTimeout(() => {
      void checkForUpdates();
      timer = setInterval(() => void checkForUpdates(), CHECK_INTERVAL_MS);
    }, INITIAL_CHECK_DELAY_MS);

  return () => {
    if (timer) clearTimeout(timer);
    if (mockTimer) clearInterval(mockTimer);
    autoUpdater?.removeAllListeners();
  };
}
