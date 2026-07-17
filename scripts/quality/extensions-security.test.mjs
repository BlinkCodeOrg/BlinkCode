import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('extension runtime is permission-gated and excludes Node globals', async () => {
  const runtime = await readFile(
    'server/extensions/activateExtension.js',
    'utf8',
  );
  assert.match(runtime, /vm\.createContext/);
  assert.match(
    runtime,
    /codeGeneration:\s*\{\s*strings:\s*false,\s*wasm:\s*false/,
  );
  assert.doesNotMatch(runtime, /\{\s*blinkcode:\s*api,\s*require/);
  assert.doesNotMatch(runtime, /\{\s*blinkcode:\s*api,\s*process/);
  assert.match(runtime, /Missing permission/);
});

test('extension marketplace packages ship with explicit manifests and entry files', async (t) => {
  let registry;
  try {
    registry = JSON.parse(
      await readFile('extensions/marketplace/marketplace.json', 'utf8'),
    );
  } catch (error) {
    if (error?.code === 'ENOENT') {
      t.skip(
        'The legacy extensions submodule is not part of the application checkout.',
      );
      return;
    }
    throw error;
  }
  assert.equal(registry.schemaVersion, 1);
  assert.equal(registry.extensions.length >= 3, true);
  for (const extension of registry.extensions) {
    const root = `extensions/marketplace/${extension.directory}`;
    const manifest = JSON.parse(await readFile(`${root}/bcode.json`, 'utf8'));
    assert.equal(manifest.id, extension.id);
    assert.equal(typeof manifest.main, 'string');
    assert.equal(typeof manifest.readme, 'string');
    assert.equal(typeof manifest.icon, 'string');
    assert.equal(typeof manifest.license, 'string');
    assert.equal(typeof manifest.publishedAt, 'string');
    assert.equal(typeof manifest.lastUpdatedAt, 'string');
    assert.equal(typeof manifest.lastReleasedAt, 'string');
    assert.equal(typeof manifest.resources?.repository, 'string');
    assert.equal(
      (await readFile(`${root}/${manifest.main}`, 'utf8')).length > 0,
      true,
    );
    assert.equal(
      (await readFile(`${root}/${manifest.readme}`, 'utf8')).length > 0,
      true,
    );
    assert.equal((await readFile(`${root}/${manifest.icon}`)).length > 0, true);
  }
});
