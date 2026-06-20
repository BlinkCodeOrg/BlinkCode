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
    return { errorKey: 'updates.errorMissingFiles' };
  }
  if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|network|fetch/i.test(raw)) {
    return { errorKey: 'updates.errorNetwork' };
  }
  return { errorKey: 'updates.errorUnknown', error: raw.split('\n')[0] || '' };
}

function normalizeReleaseNotes(notes) {
  const raw = Array.isArray(notes)
    ? notes.map(note => (typeof note === 'string' ? note : note?.note || '')).join('\n')
    : String(notes || '');

  return raw
    .replace(/<\/(h[1-6]|p|li|ul|ol)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li>/gi, '- ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .join('\n');
}

function selectWindowsDownloadAsset(assets = []) {
  const candidates = assets
    .filter(asset => typeof asset?.browser_download_url === 'string' && /\.exe$/i.test(asset.name || ''));
  return candidates.find(asset => /Setup/i.test(asset.name || ''))
    || candidates.find(asset => /Portable/i.test(asset.name || ''))
    || candidates[0]
    || null;
}

function hasUpdateMetadata(assets = []) {
  return assets.some(asset => /(^|\/)latest\.yml$/i.test(asset?.name || ''));
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
  const manualAsset = selectWindowsDownloadAsset(release?.assets || []);
  return {
    version,
    releaseNotes: normalizeReleaseNotes(release?.body),
    releaseUrl: typeof release?.html_url === 'string' ? release.html_url : '',
    manualDownloadUrl: manualAsset?.browser_download_url || '',
    hasUpdateMetadata: hasUpdateMetadata(release?.assets || []),
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
  autoUpdater.autoInstallOnAppQuit = false;
  let downloadedUpdateInfo = null;
  autoUpdater.on('checking-for-update', () => send('update:status', { status: 'checking' }));
  autoUpdater.on('update-not-available', info => send('update:status', { status: 'current', version: info.version }));
  autoUpdater.on('update-available', info => send('update:status', {
    status: compareVersions(info.version, currentVersion) > 0 ? 'available' : 'current',
    version: info.version,
    releaseNotes: normalizeReleaseNotes(info.releaseNotes),
  }));
  autoUpdater.on('download-progress', progress => send('update:status', { status: 'downloading', percent: progress.percent }));
  autoUpdater.on('update-downloaded', info => {
    downloadedUpdateInfo = info;
    send('update:status', { status: 'ready', version: info.version });
  });
  autoUpdater.on('error', error => send('update:status', { status: 'error', ...compactUpdateError(error) }));
  ipcMain.handle('update:check', async () => {
    try {
      const latestRelease = await getLatestGitHubRelease();
      if (!latestRelease || compareVersions(latestRelease.version, currentVersion) <= 0) {
        return { status: 'current', version: latestRelease?.version || currentVersion };
      }
      if (!latestRelease.hasUpdateMetadata) {
        return {
          status: 'manual',
          version: latestRelease.version,
          releaseNotes: latestRelease.releaseNotes,
          releaseUrl: latestRelease.releaseUrl,
          manualDownloadUrl: latestRelease.manualDownloadUrl || latestRelease.releaseUrl,
        };
      }

      let result;
      try {
        result = await autoUpdater.checkForUpdates();
      } catch (error) {
        if (/404|Cannot find latest\.yml/i.test(error instanceof Error ? error.message : String(error || ''))) {
          return {
            status: 'manual',
            version: latestRelease.version,
            releaseNotes: latestRelease.releaseNotes,
            releaseUrl: latestRelease.releaseUrl,
            manualDownloadUrl: latestRelease.manualDownloadUrl || latestRelease.releaseUrl,
          };
        }
        throw error;
      }
      const info = result?.updateInfo;
      if (info?.version && compareVersions(info.version, currentVersion) > 0) {
        return {
          status: 'available',
          version: info.version,
          releaseNotes: normalizeReleaseNotes(info.releaseNotes),
        };
      }
      return { status: 'current', version: info?.version || currentVersion };
    } catch (error) {
      return { status: 'error', ...compactUpdateError(error) };
    }
  });
  ipcMain.handle('update:download', async () => {
    send('update:status', { status: 'downloading', percent: 0 });
    await autoUpdater.downloadUpdate();
    return { status: 'ready', version: downloadedUpdateInfo?.version };
  });
  ipcMain.handle('update:install', () => {
    autoUpdater.quitAndInstall(true, true);
    return true;
  });
}
