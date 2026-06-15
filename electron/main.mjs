import electron from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProjectFromTemplate } from './createProjectFromTemplate.mjs';
import { registerSecretIpc } from './registerSecretIpc.mjs';
import { registerUpdaterIpc } from './registerUpdaterIpc.mjs';
// Server is imported dynamically — in dev mode it runs as a separate
// system-Node process so Electron must NOT load the native better-sqlite3
// module (different ABI). In packaged mode we start it in-process.

const { app, BrowserWindow, dialog, ipcMain, Menu, safeStorage, shell } = electron;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
let allowWindowClose = false;
let appIsQuitting = false;
const approvedProjectParentPaths = new Set();

function isSafeHttpUrl(rawUrl) {
  if (typeof rawUrl !== 'string') return false;

  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function appIconPath() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'icon.ico')
    : path.join(__dirname, '..', 'build', 'icon.ico');
}

function registerIpc() {
  registerSecretIpc({ app, ipcMain, safeStorage });
  ipcMain.removeHandler?.('dialog:openFolder');
  ipcMain.removeHandler?.('project:createFromTemplate');
  ipcMain.removeHandler?.('window:minimize');
  ipcMain.removeHandler?.('window:maximize');
  ipcMain.removeHandler?.('window:close');
  ipcMain.removeHandler?.('window:forceClose');
  ipcMain.removeHandler?.('window:isMaximized');
  ipcMain.removeHandler?.('shell:openExternal');
  ipcMain.removeHandler?.('shell:revealInFolder');
  ipcMain.removeHandler?.('shell:trashItem');

  ipcMain.handle('dialog:openFolder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });

    if (result.canceled || !result.filePaths.length) return null;
    const selectedPath = path.resolve(result.filePaths[0]);
    approvedProjectParentPaths.add(selectedPath);
    return selectedPath;
  });

  ipcMain.handle('project:createFromTemplate', async (_event, request) => {
    const parentPath = path.resolve(String(request?.parentPath || ''));
    if (!approvedProjectParentPaths.has(parentPath)) throw new Error('Choose the destination folder again');
    return createProjectFromTemplate(parentPath, request?.projectName, request?.files);
  });

  ipcMain.handle('window:minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.handle('window:maximize', () => {
    if (!mainWindow) return false;
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
      return false;
    }
    mainWindow.maximize();
    return true;
  });

  ipcMain.handle('window:close', () => {
    mainWindow?.webContents.send('window:close-requested');
  });

  ipcMain.handle('window:forceClose', () => {
    allowWindowClose = true;
    mainWindow?.close();
  });

  ipcMain.handle('window:isMaximized', () => {
    return mainWindow?.isMaximized() ?? false;
  });

  ipcMain.handle('shell:openExternal', async (_event, url) => {
    if (!isSafeHttpUrl(url)) return false;
    await shell.openExternal(url);
    return true;
  });

  ipcMain.handle('shell:revealInFolder', async (_event, filePath) => {
    if (typeof filePath !== 'string' || !path.isAbsolute(filePath)) return false;
    shell.showItemInFolder(filePath);
    return true;
  });

  ipcMain.handle('shell:trashItem', async (_event, filePath) => {
    if (typeof filePath !== 'string' || !path.isAbsolute(filePath)) return false;
    try {
      const backendPort = process.env.PORT || (app.isPackaged ? '3210' : '3001');
      const response = await fetch(`http://127.0.0.1:${backendPort}/api/tree`);
      const data = await response.json();
      const workspacePath = path.resolve(String(data.workspacePath || ''));
      const targetPath = path.resolve(filePath);
      const relative = path.relative(workspacePath, targetPath);
      if (!workspacePath || relative.startsWith('..') || path.isAbsolute(relative)) return false;
      await shell.trashItem(targetPath);
      return true;
    } catch {
      return false;
    }
  });
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForServer(url, attempts = 60) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {}

    await wait(500);
  }

  throw new Error(`Server did not start: ${url}`);
}

async function createWindow() {
  allowWindowClose = false;
  const backendPort = process.env.PORT || (app.isPackaged ? '3210' : '3001');
  const backendUrl = `http://127.0.0.1:${backendPort}`;
  const rendererUrl = app.isPackaged
    ? backendUrl
    : (process.env.BLINKCODE_RENDERER_URL || backendUrl);

  if (app.isPackaged) {
    const { startBlinkCodeServer } = await import('../server/index.js');
    await startBlinkCodeServer(backendPort);
  }

  await waitForServer(backendUrl);
  if (rendererUrl !== backendUrl) await waitForServer(rendererUrl);

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#0e1017',
    title: '',
    frame: false,
    titleBarStyle: 'hidden',
    icon: appIconPath(),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  mainWindow.webContents.on('will-attach-webview', (event, webPreferences, params) => {
    delete webPreferences.preload;
    webPreferences.nodeIntegration = false;
    webPreferences.contextIsolation = true;
    webPreferences.sandbox = true;
    webPreferences.webSecurity = true;
    webPreferences.allowRunningInsecureContent = false;
    webPreferences.enableBlinkFeatures = '';

    if (!isSafeHttpUrl(params.src)) {
      event.preventDefault();
    }
  });

  mainWindow.webContents.session.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });

  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const currentUrl = mainWindow?.webContents.getURL();
    if (!currentUrl) return;
    try {
      if (new URL(navigationUrl).origin !== new URL(currentUrl).origin) {
        event.preventDefault();
      }
    } catch {
      event.preventDefault();
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isSafeHttpUrl(url)) {
      shell.openExternal(url).catch(() => {});
    }

    return { action: 'deny' };
  });

  await mainWindow.loadURL(rendererUrl);

  mainWindow.webContents.setZoomFactor(1);
  mainWindow.webContents.setVisualZoomLevelLimits(1, 1);
  if (app.isPackaged) {
    mainWindow.maximize();
  }

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    const isF12 = input.key === 'F12';
    const isCtrlShiftI = input.control && input.shift && (input.key === 'I' || input.key === 'i');
    if (isF12 || isCtrlShiftI) {
      mainWindow?.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  mainWindow.on('close', event => {
    if (allowWindowClose || appIsQuitting) return;
    event.preventDefault();
    mainWindow?.webContents.send('window:close-requested');
  });
}

app.whenReady()
  .then(async () => {
    Menu.setApplicationMenu(null);
    registerIpc();
    await registerUpdaterIpc({
      app,
      ipcMain,
      send: (channel, payload) => mainWindow?.webContents.send(channel, payload),
    });
    await createWindow();
  })
  .catch(error => {
    console.error('BlinkCode failed to start', error);
    dialog.showErrorBox(
      'BlinkCode could not start',
      error instanceof Error ? error.message : String(error),
    );
    app.quit();
  });

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow().catch(err => {
      console.error('Failed to create window', err);
      app.quit();
    });
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  appIsQuitting = true;
  mainWindow = null;
});
