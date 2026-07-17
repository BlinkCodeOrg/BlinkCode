const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  createProjectFromTemplate: (request) =>
    ipcRenderer.invoke('project:createFromTemplate', request),
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
  revealInFolder: (filePath) =>
    ipcRenderer.invoke('shell:revealInFolder', filePath),
  trashItem: (filePath) => ipcRenderer.invoke('shell:trashItem', filePath),
  getPathForFile: (file) => webUtils.getPathForFile(file),
  getAppVersion: () => ipcRenderer.invoke('app:get-version'),
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  forceCloseWindow: () => ipcRenderer.invoke('window:forceClose'),
  onCloseRequested: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('window:close-requested', listener);
    return () => ipcRenderer.removeListener('window:close-requested', listener);
  },
  isWindowMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  getSecret: (key) => ipcRenderer.invoke('secret:get', key),
  setSecret: (key, value) => ipcRenderer.invoke('secret:set', key, value),
  deleteSecret: (key) => ipcRenderer.invoke('secret:delete', key),
  updates: {
    isAutoUpdateSupported: () =>
      ipcRenderer.invoke('updates:is-auto-update-supported'),
    getUpdateStatus: () => ipcRenderer.invoke('updates:get-update-status'),
    checkForUpdates: () => ipcRenderer.invoke('updates:check-for-updates'),
    downloadUpdate: () => ipcRenderer.invoke('updates:download-update'),
    installUpdate: () => ipcRenderer.invoke('updates:install-update'),
    hasUpdated: () => ipcRenderer.invoke('updates:has-updated'),
    setAutoUpdate: (enabled) =>
      ipcRenderer.invoke('updates:set-auto-update', enabled),
    setMockState: (state) =>
      ipcRenderer.invoke('updates:set-mock-state', state),
    onUpdateStatusChanged: (callback) => {
      const listener = (_event, payload) => callback(payload);
      ipcRenderer.on('updates:on-update-status-changed', listener);
      return () =>
        ipcRenderer.removeListener(
          'updates:on-update-status-changed',
          listener,
        );
    },
  },
  checkForUpdates: () => ipcRenderer.invoke('updates:check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('updates:download-update'),
  installUpdate: () => ipcRenderer.invoke('updates:install-update'),
  onUpdateStatus: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('update:status', listener);
    return () => ipcRenderer.removeListener('update:status', listener);
  },
});
