export function resolveAutoUpdater(updaterModule) {
  const autoUpdater = updaterModule?.autoUpdater
    || updaterModule?.default?.autoUpdater
    || updaterModule?.default;

  if (!autoUpdater || typeof autoUpdater.checkForUpdates !== 'function') {
    throw new TypeError('electron-updater did not provide a compatible autoUpdater instance');
  }

  return autoUpdater;
}
