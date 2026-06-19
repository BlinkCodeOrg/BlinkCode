import { resolveAutoUpdater } from './resolveAutoUpdater.mjs';

const RELEASES_API_URL = 'https://api.github.com/repos/BlinkCodeOrg/BlinkCode/releases/latest';

function normalizeVersion(version) {
  return String(version || '').trim().replace(/^v/i, '');
}

function compareVersions(left, right) {
  const leftParts = normalizeVersion(left).split(/[.-]/).map(part => Number.parseInt(part, 10) || 0);
  const rightParts = normalizeVersion(right).split(/[.-]/).map(part => Number.parseInt(part, 10) || 0);
  const length = Math.max(leftParts.length, rightParts.length, 3);
  for (let index = 0; index < length; index += 1) {
    const leftValue = leftParts[index] || 0;
    const rightValue = rightParts[index] || 0;
    if (leftValue > rightValue) return 1;
    if (leftValue < rightValue) return -1;
  }
  return 0;
}

function compactUpdateError(error) {
  const raw = error instanceof Error ? error.message : String(error || '');
  if (/404|Cannot find latest\.yml|No published versions/i.test(raw)) {
    return 'Update files are not published for the latest GitHub release yet.';
  }
  if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|network|fetch/i.test(raw)) {
    return 'Could not reach GitHub to check for updates.';
  }
  return raw.split('\n')[0] || 'Could not check for updates.';
}

async function getLatestGitHubRelease() {
  const response = await fetch(RELEASES_API_URL, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'BlinkCode-Updater',
    },
  });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GitHub release check failed: ${response.status}`);

  const release = await response.json();
  const version = normalizeVersion(release?.tag_name);
  if (!version) return null;
  return {
    version,
    releaseNotes: typeof release?.body === 'string' ? release.body : '',
  };
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
  autoUpdater.on('error', error => send('update:status', { status: 'error', error: compactUpdateError(error) }));
  ipcMain.handle('update:check', async () => {
    try {
      const latestRelease = await getLatestGitHubRelease();
      if (!latestRelease || compareVersions(latestRelease.version, currentVersion) <= 0) {
        return { status: 'current', version: latestRelease?.version || currentVersion };
      }

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
    } catch (error) {
      return { status: 'error', error: compactUpdateError(error) };
    }
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
