import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { resolveAutoUpdater } from '../../electron/resolveAutoUpdater.mjs';

const read = path => readFileSync(path, 'utf8');

test('desktop secrets use Electron safeStorage instead of renderer persistence', () => {
  assert.match(read('electron/registerSecretIpc.mjs'), /safeStorage\.encryptString/);
  assert.match(read('electron/registerSecretIpc.mjs'), /safeStorage\.decryptString/);
  assert.match(read('src/features/ai/aiConfig.ts'), /setSecret\('ai\.apiKey'/);
});

test('release workflow builds Windows macOS and Linux update artifacts', () => {
  const workflow = read('.github/workflows/release.yml');
  assert.match(workflow, /windows-latest/);
  assert.match(workflow, /macos-latest/);
  assert.match(workflow, /ubuntu-latest/);
  assert.match(read('package.json'), /electron-updater/);
  assert.match(read('electron/registerUpdaterIpc.mjs'), /checkForUpdates/);
});

test('packaged updater resolves native ESM and CommonJS module shapes', () => {
  const updater = { checkForUpdates() {} };

  assert.equal(resolveAutoUpdater({ autoUpdater: updater }), updater);
  assert.equal(resolveAutoUpdater({ default: { autoUpdater: updater } }), updater);
  assert.equal(resolveAutoUpdater({ default: updater }), updater);
  assert.throws(() => resolveAutoUpdater({}), /compatible autoUpdater/);
  assert.match(read('electron/main.mjs'), /BlinkCode failed to start/);
});

test('desktop packaging force-rebuilds and verifies Electron native modules', () => {
  const packageJson = read('package.json');
  const verifier = read('scripts/release/verifyElectronNative.mjs');

  assert.match(packageJson, /electron-rebuild -f -w better-sqlite3/);
  assert.match(packageJson, /"npmRebuild": false/);
  assert.match(packageJson, /npm run rebuild:electron-native/);
  assert.match(verifier, /ELECTRON_RUN_AS_NODE/);
  assert.match(verifier, /require\('better-sqlite3'\)/);
});

test('packaged IDE does not ship the paused extension marketplace', () => {
  const buildConfig = JSON.parse(read('package.json')).build;

  assert.equal(buildConfig.files.includes('extensions/**/*'), false);
});
