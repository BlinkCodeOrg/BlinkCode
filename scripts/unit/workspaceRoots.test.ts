import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createWorkspaceRoots } from '../../server/workspaceRoots.js';

test('workspace roots persist and resolve virtual paths safely', () => {
  const storage = mkdtempSync(join(tmpdir(), 'blinkcode-roots-state-'));
  const primary = mkdtempSync(join(tmpdir(), 'blinkcode-root-primary-'));
  const secondary = join(storage, 'secondary');
  mkdirSync(secondary);
  try {
    const roots = createWorkspaceRoots(() => primary, storage);
    const added = roots.add(secondary);
    assert.equal(added.length, 2);
    const secondaryRoot = added.find(item => !item.primary)!;
    const virtual = roots.virtualPath(secondaryRoot.id, 'src/index.ts');
    assert.deepEqual(roots.resolve(virtual), {
      root: secondary,
      path: 'src/index.ts',
      rootId: secondaryRoot.id,
    });
    assert.equal(createWorkspaceRoots(() => primary, storage).getRoots().length, 2);
    assert.throws(() => roots.resolve('@root/not-found/file.ts'), /INVALID_ROOT/);
  } finally {
    rmSync(primary, { recursive: true, force: true });
    rmSync(storage, { recursive: true, force: true });
  }
});
