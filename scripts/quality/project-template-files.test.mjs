import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import test from 'node:test';
import { createProjectFromTemplate } from '../../electron/createProjectFromTemplate.mjs';

test('desktop project creation writes outside the active workspace and rejects collisions', async () => {
  const parent = mkdtempSync(resolve(tmpdir(), 'blinkcode-template-'));
  try {
    const result = await createProjectFromTemplate(parent, 'My App', {
      'package.json': '{\n  "name": "my-app"\n}\n',
      'src/index.js': 'console.log("ready");\n',
    });

    assert.equal(existsSync(resolve(parent, 'My App/src/index.js')), true);
    assert.equal(JSON.parse(readFileSync(resolve(parent, 'My App/package.json'), 'utf8')).name, 'my-app');
    await assert.rejects(
      createProjectFromTemplate(parent, 'My App', { 'README.md': 'duplicate' }),
      /exist/i,
    );
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});

test('desktop project creation rejects template paths outside the selected folder', async () => {
  const parent = mkdtempSync(resolve(tmpdir(), 'blinkcode-template-safe-'));
  try {
    await assert.rejects(
      createProjectFromTemplate(parent, 'Safe App', { '../escape.txt': 'blocked' }),
      /Invalid template file path/,
    );
    assert.equal(existsSync(resolve(parent, 'escape.txt')), false);
    assert.equal(existsSync(resolve(parent, 'Safe App')), false);
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});
