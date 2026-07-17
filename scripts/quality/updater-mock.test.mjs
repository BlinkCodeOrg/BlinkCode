import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { registerUpdaterIpc } from '../../electron/registerUpdaterIpc.mjs';

test('development updater mock covers discovery, progress, failure, download and install', async () => {
  const previous = process.env.BLINKCODE_UPDATE_MOCK;
  process.env.BLINKCODE_UPDATE_MOCK = '1';
  const handlers = new Map();
  const events = [];
  const userData = fs.mkdtempSync(
    path.join(os.tmpdir(), 'blinkcode-updater-mock-'),
  );
  const app = {
    isPackaged: false,
    getPath: () => userData,
    getVersion: () => '1.0.0',
  };
  const ipcMain = {
    removeHandler: (channel) => handlers.delete(channel),
    handle: (channel, handler) => handlers.set(channel, handler),
  };

  const dispose = await registerUpdaterIpc({
    app,
    ipcMain,
    send: (channel, payload) => events.push({ channel, payload }),
  });
  const invoke = (channel, ...args) => handlers.get(channel)({}, ...args);

  try {
    assert.equal(await invoke('updates:is-auto-update-supported'), true);
    const firstCheck = invoke('updates:check-for-updates');
    const repeatedCheck = await invoke('updates:check-for-updates');
    assert.equal(repeatedCheck.phase, 'checking');
    await firstCheck;
    assert.equal(
      (await invoke('updates:get-update-status')).phase,
      'available',
    );
    assert.equal(await invoke('updates:set-auto-update', false), false);

    const download = invoke('updates:download-update');
    assert.equal(await invoke('updates:download-update'), false);
    assert.equal(await download, true);
    assert.equal(await invoke('updates:set-auto-update', true), true);
    assert.equal(
      (await invoke('updates:get-update-status')).phase,
      'downloaded',
    );
    const progress = events
      .filter((event) => event.channel === 'updates:on-update-status-changed')
      .map((event) => event.payload.downloadProgress?.percent)
      .filter((value) => typeof value === 'number');
    assert.equal(progress.at(0), 0);
    assert.equal(progress.at(-1), 100);

    await invoke('updates:set-mock-state', 'download-error');
    assert.equal(
      (await invoke('updates:get-update-status')).phase,
      'download-error',
    );
    await invoke('updates:set-mock-state', 'downloaded');
    assert.equal(await invoke('updates:install-update'), true);
    assert.equal(
      (await invoke('updates:get-update-status')).phase,
      'installing',
    );
  } finally {
    dispose();
    fs.rmSync(userData, { recursive: true, force: true });
    if (previous === undefined) delete process.env.BLINKCODE_UPDATE_MOCK;
    else process.env.BLINKCODE_UPDATE_MOCK = previous;
  }
});

test('updater mock is guarded from packaged production builds', () => {
  const source = fs.readFileSync(
    new URL('../../electron/registerUpdaterIpc.mjs', import.meta.url),
    'utf8',
  );
  assert.match(
    source,
    /!app\.isPackaged && process\.env\.BLINKCODE_UPDATE_MOCK === ["']1["']/,
  );
});
