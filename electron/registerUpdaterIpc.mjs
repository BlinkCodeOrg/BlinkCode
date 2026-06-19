import { resolveAutoUpdater } from './resolveAutoUpdater.mjs';

function compareVersions(left, right) {
  const leftParts = String(left || '').split(/[.-]/).map(part => Number.parseInt(part, 10) || 0);
  const rightParts = String(right || '').split(/[.-]/).map(part => Number.parseInt(part, 10) || 0);
  const length = Math.max(leftParts.length, rightParts.length, 3);
  for (let index = 0; index < length; index += 1) {
    const leftValue = leftParts[index] || 0;
    const rightValue = rightParts[index] || 0;
    if (leftValue > rightValue) return 1;
    if (leftValue < rightValue) return -1;
  }
  return 0;
}

export async function registerUpdaterIpc({ app, ipcMain, send }) {
  ipcMain.removeHandler?.('update:check');
  ipcMain.removeHandler?.('update:download');
  ipcMain.removeHandler?.('update:install');
  if (!app.isPackaged) {
    ipcMain.handle('update:check', () => ({ status: 'development' }));
    ipcMain.handle('update:download', () => ({ status: 'development' }));
    ipcMain.handle('update:install', () => false);
    return;
  }

  const autoUpdater = resolveAutoUpdater(await import('electron-updater'));
  const currentVersion = app.getVersion();
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on('checking-for-update', () => send('update:status', { status: 'checking' }));
  autoUpdater.on('update-not-available', info => send('update:status', { status: 'current', version: info.version }));
  autoUpdater.on('update-available', info => send('update:status', {
    status: compareVersions(info.version, currentVersion) > 0 ? 'available' : 'current',
    version: info.version,
    releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : '',
  }));
  autoUpdater.on('download-progress', progress => send('update:status', { status: 'downloading', percent: progress.percent }));
  autoUpdater.on('update-downloaded', info => send('update:status', { status: 'ready', version: info.version }));
  autoUpdater.on('error', error => send('update:status', { status: 'error', error: error.message }));
  ipcMain.handle('update:check', async () => {
    const result = await autoUpdater.checkForUpdates();
    const info = result?.updateInfo;
    if (info?.version && compareVersions(info.version, currentVersion) > 0) {
      return {
        status: 'available',
        version: info.version,
        releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : '',
      };
    }
    return { status: 'current', version: info?.version || currentVersion };
  });
  ipcMain.handle('update:download', async () => {
    await autoUpdater.downloadUpdate();
    return { status: 'downloading' };
  });
  ipcMain.handle('update:install', () => {
    autoUpdater.quitAndInstall(false, true);
    return true;
  });
}
