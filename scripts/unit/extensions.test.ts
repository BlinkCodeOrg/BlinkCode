import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import test from 'node:test';
import { activateExtension } from '../../server/extensions/activateExtension.js';
import { createExtensionService } from '../../server/extensions/createExtensionService.js';
import { validateExtensionManifest } from '../../server/extensions/validateExtensionManifest.js';

test('bundled extensions activate declared features and persist lifecycle changes', () => {
  const directory = mkdtempSync(resolve(tmpdir(), 'blinkcode-extensions-'));
  try {
    const statePath = resolve(directory, 'state.json');
    const service = createExtensionService({
      marketplaceRoots: [resolve('extensions/marketplace')],
      statePath,
    });
    const initial = service.list();
    assert.deepEqual(initial.activeFeatures, ['markdown-preview', 'spell-checker', 'theme-import']);
    assert.equal(initial.extensions.every(extension => extension.installed && extension.enabled), true);

    const disabled = service.disable('blinkcode.spell-checker');
    assert.equal(disabled.activeFeatures.includes('spell-checker'), false);
    assert.equal(disabled.extensions.find(extension => extension.id === 'blinkcode.spell-checker')?.enabled, false);

    const enabled = service.enable('blinkcode.spell-checker');
    assert.equal(enabled.activeFeatures.includes('spell-checker'), true);
    service.uninstall('blinkcode.spell-checker');
    assert.equal(service.list().extensions.find(extension => extension.id === 'blinkcode.spell-checker')?.installed, false);
    service.install('blinkcode.spell-checker');
    assert.equal(service.list().extensions.find(extension => extension.id === 'blinkcode.spell-checker')?.enabled, true);
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
  assert.throws(() => validateExtensionManifest({ ...base, main: '../outside.js' }), /main/);
  assert.throws(() => validateExtensionManifest({ ...base, permissions: ['filesystem'] }), /permission/);
  assert.throws(() => validateExtensionManifest({ ...base, resources: { repository: 'file:///tmp/repo' } }), /HTTP/);
  const valid = validateExtensionManifest({
    ...base,
    license: 'MIT',
    publishedAt: '2026-06-01T00:00:00.000Z',
    resources: { repository: 'https://example.com/repository' },
  });
  assert.equal(valid.resources.repository, 'https://example.com/repository');
});

test('sandbox activation failure is isolated to the offending extension', () => {
  const directory = mkdtempSync(resolve(tmpdir(), 'blinkcode-extension-sandbox-'));
  try {
    writeFileSync(resolve(directory, 'extension.js'), 'process.exit(1);', 'utf8');
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
    assert.throws(() => activateExtension(directory, manifest), /process is not defined/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
