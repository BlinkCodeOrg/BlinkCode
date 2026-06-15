import fs from 'node:fs';
import path from 'node:path';

export function createSecretStore({ app, safeStorage }) {
  const secretPath = path.join(app.getPath('userData'), 'secrets.json');
  const read = () => {
    try { return JSON.parse(fs.readFileSync(secretPath, 'utf8')); } catch { return {}; }
  };
  const write = value => {
    fs.mkdirSync(path.dirname(secretPath), { recursive: true });
    fs.writeFileSync(secretPath, JSON.stringify(value), { mode: 0o600 });
  };

  const get = key => {
    const encrypted = read()[String(key)];
    if (!encrypted || !safeStorage.isEncryptionAvailable()) return '';
    try { return safeStorage.decryptString(Buffer.from(encrypted, 'base64')); } catch { return ''; }
  };
  const set = (key, value) => {
    if (!safeStorage.isEncryptionAvailable()) throw new Error('OS secure storage is unavailable');
    const secrets = read();
    secrets[String(key)] = safeStorage.encryptString(String(value || '')).toString('base64');
    write(secrets);
    return true;
  };
  const remove = key => {
    const secrets = read();
    delete secrets[String(key)];
    write(secrets);
    return true;
  };
  return { get, set, remove };
}

export function registerSecretIpc({ app, ipcMain, safeStorage }) {
  const store = createSecretStore({ app, safeStorage });
  ipcMain.removeHandler?.('secret:get');
  ipcMain.removeHandler?.('secret:set');
  ipcMain.removeHandler?.('secret:delete');
  ipcMain.handle('secret:get', (_event, key) => store.get(key));
  ipcMain.handle('secret:set', (_event, key, value) => store.set(key, value));
  ipcMain.handle('secret:delete', (_event, key) => store.remove(key));
  return store;
}
