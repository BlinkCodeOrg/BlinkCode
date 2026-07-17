import assert from 'node:assert/strict';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import test from 'node:test';
import { activateExtension } from '../../server/extensions/activateExtension.js';
import { createExtensionService } from '../../server/extensions/createExtensionService.js';
import { validateExtensionManifest } from '../../server/extensions/validateExtensionManifest.js';

test('bundled extensions activate declared features and persist lifecycle changes', async (t) => {
  if (!existsSync(resolve('extensions/marketplace/marketplace.json'))) {
    t.skip(
      'The legacy extensions submodule is not part of the application checkout.',
    );
    return;
  }
  const directory = mkdtempSync(resolve(tmpdir(), 'blinkcode-extensions-'));
  try {
    const statePath = resolve(directory, 'state.json');
    const service = createExtensionService({
      marketplaceRoots: [resolve('extensions/marketplace')],
      statePath,
    });
    const initial = await service.list();
    assert.deepEqual(initial.activeFeatures, [
      'markdown-preview',
      'spell-checker',
      'theme-import',
    ]);
    assert.equal(
      initial.extensions.every(
        (extension) => extension.installed && extension.enabled,
      ),
      true,
    );

    const disabled = await service.disable('blinkcode.spell-checker');
    assert.equal(disabled.activeFeatures.includes('spell-checker'), false);
    assert.equal(
      disabled.extensions.find(
        (extension) => extension.id === 'blinkcode.spell-checker',
      )?.enabled,
      false,
    );

    const enabled = await service.enable('blinkcode.spell-checker');
    assert.equal(enabled.activeFeatures.includes('spell-checker'), true);
    await service.uninstall('blinkcode.spell-checker');
    assert.equal(
      (await service.list()).extensions.find(
        (extension) => extension.id === 'blinkcode.spell-checker',
      )?.installed,
      false,
    );
    await service.install('blinkcode.spell-checker');
    assert.equal(
      (await service.list()).extensions.find(
        (extension) => extension.id === 'blinkcode.spell-checker',
      )?.enabled,
      true,
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('remote marketplace extensions download, validate and remain available offline', async () => {
  const directory = mkdtempSync(
    resolve(tmpdir(), 'blinkcode-remote-extension-'),
  );
  const marketplaceRoot = resolve(directory, 'marketplace');
  const registryUrl = 'https://extensions.example.invalid/marketplace.json';
  const manifest = {
    schemaVersion: 1,
    id: 'demo.remote-extension',
    name: 'remote-extension',
    displayName: 'Remote Extension',
    publisher: 'demo',
    version: '1.0.0',
    description: 'Remote fixture',
    main: 'extension.js',
    readme: 'README.md',
    icon: 'icon.svg',
    permissions: ['commands'],
    contributes: {
      commands: [{ command: 'demo.remote-extension.hello', title: 'Hello' }],
    },
  };
  const files = new Map([
    [
      registryUrl,
      JSON.stringify({
        schemaVersion: 1,
        extensions: [
          {
            id: manifest.id,
            directory: 'demo-remote-extension',
            featured: true,
          },
        ],
      }),
    ],
    [
      new URL('demo-remote-extension/bcode.json', registryUrl).toString(),
      JSON.stringify(manifest),
    ],
    [
      new URL('demo-remote-extension/extension.js', registryUrl).toString(),
      "blinkcode.registerCommand('demo.remote-extension.hello', { type: 'showMessage', message: 'Hello' });",
    ],
    [
      new URL('demo-remote-extension/README.md', registryUrl).toString(),
      '# Remote Extension',
    ],
    [
      new URL('demo-remote-extension/icon.svg', registryUrl).toString(),
      '<svg xmlns="http://www.w3.org/2000/svg"><rect width="16" height="16"/></svg>',
    ],
  ]);
  const fetchImpl = async (input: URL | RequestInfo) => {
    const url = input.toString();
    const body = files.get(url);
    return new Response(body || 'Not found', {
      status: body ? 200 : 404,
      headers: {
        'content-length': String(Buffer.byteLength(body || 'Not found')),
      },
    });
  };

  try {
    const service = createExtensionService({
      fetchImpl,
      marketplaceRoots: [marketplaceRoot],
      remoteRegistryUrl: registryUrl,
      statePath: resolve(directory, 'state.json'),
      userMarketplaceRoot: marketplaceRoot,
    });
    const available = await service.list();
    assert.equal(available.extensions[0].id, manifest.id);
    assert.equal(available.extensions[0].installed, false);

    const installed = await service.install(manifest.id);
    assert.equal(installed.extensions[0].installed, true);
    assert.equal(installed.extensions[0].installedVersion, '1.0.0');
    assert.equal(installed.extensions[0].updateAvailable, false);
    assert.equal(installed.commands[0].command, 'demo.remote-extension.hello');
    assert.equal(
      existsSync(
        resolve(marketplaceRoot, 'demo-remote-extension', 'extension.js'),
      ),
      true,
    );
    const registry = JSON.parse(
      readFileSync(resolve(marketplaceRoot, 'marketplace.json'), 'utf8'),
    );
    assert.equal(registry.extensions[0].id, manifest.id);

    const updatedManifest = {
      ...manifest,
      version: '1.1.0',
      description: 'Updated remote fixture',
    };
    files.set(
      new URL('demo-remote-extension/bcode.json', registryUrl).toString(),
      JSON.stringify(updatedManifest),
    );
    files.set(
      new URL('demo-remote-extension/extension.js', registryUrl).toString(),
      "blinkcode.registerCommand('demo.remote-extension.hello', { type: 'showMessage', message: 'Updated' });",
    );
    const updateAvailable = await service.list(true);
    assert.equal(updateAvailable.extensions[0].latestVersion, '1.1.0');
    assert.equal(updateAvailable.extensions[0].installedVersion, '1.0.0');
    assert.equal(updateAvailable.extensions[0].updateAvailable, true);

    const updated = await service.update(manifest.id);
    assert.equal(updated.extensions[0].version, '1.1.0');
    assert.equal(updated.extensions[0].installedVersion, '1.1.0');
    assert.equal(updated.extensions[0].updateAvailable, false);
    assert.match(
      readFileSync(
        resolve(marketplaceRoot, 'demo-remote-extension', 'extension.js'),
        'utf8',
      ),
      /Updated/,
    );

    const offlineService = createExtensionService({
      marketplaceRoots: [marketplaceRoot],
      statePath: resolve(directory, 'state.json'),
      userMarketplaceRoot: marketplaceRoot,
    });
    const offline = await offlineService.list();
    assert.equal(offline.extensions[0].enabled, true);
    assert.equal(offline.extensions[0].version, '1.1.0');
    assert.equal(offline.extensions[0].installedVersion, '1.1.0');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('extension manifests reject package escapes and undeclared capabilities', () => {
  const base = {
    schemaVersion: 1,
    id: 'demo.safe-extension',
    name: 'safe-extension',
    displayName: 'Safe Extension',
    publisher: 'demo',
    version: '1.0.0',
    description: 'Safe extension fixture',
    main: 'extension.js',
    readme: 'README.md',
    icon: 'icon.svg',
    permissions: ['commands'],
  };
  assert.throws(
    () => validateExtensionManifest({ ...base, main: '../outside.js' }),
    /main/,
  );
  assert.throws(
    () => validateExtensionManifest({ ...base, permissions: ['filesystem'] }),
    /permission/,
  );
  assert.throws(
    () =>
      validateExtensionManifest({
        ...base,
        resources: { repository: 'file:///tmp/repo' },
      }),
    /HTTP/,
  );
  const valid = validateExtensionManifest({
    ...base,
    license: 'MIT',
    publishedAt: '2026-06-01T00:00:00.000Z',
    resources: { repository: 'https://example.com/repository' },
  });
  assert.equal(valid.resources.repository, 'https://example.com/repository');
});

test('sandbox activation failure is isolated to the offending extension', () => {
  const directory = mkdtempSync(
    resolve(tmpdir(), 'blinkcode-extension-sandbox-'),
  );
  try {
    writeFileSync(
      resolve(directory, 'extension.js'),
      'process.exit(1);',
      'utf8',
    );
    const manifest = validateExtensionManifest({
      schemaVersion: 1,
      id: 'demo.sandbox-check',
      name: 'sandbox-check',
      displayName: 'Sandbox Check',
      publisher: 'demo',
      version: '1.0.0',
      description: 'Sandbox fixture',
      main: 'extension.js',
      readme: 'README.md',
      icon: 'icon.svg',
      permissions: [],
    });
    assert.throws(
      () => activateExtension(directory, manifest),
      /process is not defined/,
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
