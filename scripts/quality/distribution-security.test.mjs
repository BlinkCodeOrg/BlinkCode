import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

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
