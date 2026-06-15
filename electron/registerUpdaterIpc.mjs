import { resolveAutoUpdater } from './resolveAutoUpdater.mjs';

export async function registerUpdaterIpc({ app, ipcMain, send }) {
  ipcMain.removeHandler?.('update:check');
  ipcMain.removeHandler?.('update:install');
  if (!app.isPackaged) {
    ipcMain.handle('update:check', () => ({ status: 'development' }));
    ipcMain.handle('update:install', () => false);
    return;
  }

  const autoUpdater = resolveAutoUpdater(await import('electron-updater'));
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on('checking-for-update', () => send('update:status', { status: 'checking' }));
  autoUpdater.on('update-not-available', info => send('update:status', { status: 'current', version: info.version }));
  autoUpdater.on('update-available', info => send('update:status', {
    status: 'available',
    version: info.version,
    releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : '',
  }));
  autoUpdater.on('download-progress', progress => send('update:status', { status: 'downloading', percent: progress.percent }));
  autoUpdater.on('update-downloaded', info => send('update:status', { status: 'ready', version: info.version }));
  autoUpdater.on('error', error => send('update:status', { status: 'error', error: error.message }));
  ipcMain.handle('update:check', async () => {
    const result = await autoUpdater.checkForUpdates();
    if (result?.updateInfo?.version && result.updateInfo.version !== app.getVersion()) {
      await autoUpdater.downloadUpdate();
    }
    return { status: 'checked', version: result?.updateInfo?.version || app.getVersion() };
  });
  ipcMain.handle('update:install', () => {
    autoUpdater.quitAndInstall(false, true);
    return true;
  });
}
