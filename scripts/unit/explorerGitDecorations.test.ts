import assert from 'node:assert/strict';
import test from 'node:test';
import { createExplorerGitDecorations } from '../../src/features/sidebar/createExplorerGitDecorations';
import { getExplorerGitDecoration } from '../../src/features/sidebar/getExplorerGitDecoration';

test('propagates Git decorations to every parent folder', () => {
  const decorations = createExplorerGitDecorations({
    isRepo: true,
    branch: 'main',
    staged: [],
    unstaged: [{ path: 'src/features/editor/index.ts', status: 'modified' }],
    untracked: [],
    conflicts: [],
  });

  assert.equal(decorations.get('src/features/editor')?.label, 'M');
  assert.equal(decorations.get('src/features')?.label, 'M');
  assert.equal(decorations.get('src')?.label, 'M');
  assert.equal(decorations.get('src/features/editor/index.ts')?.label, 'M');
});

test('uses the most important descendant status for folders', () => {
  const decorations = createExplorerGitDecorations({
    isRepo: true,
    branch: 'main',
    staged: [{ path: 'src/added.ts', status: 'added' }],
    unstaged: [{ path: 'src/modified.ts', status: 'modified' }],
    untracked: [{ path: 'src/new.ts', status: 'untracked' }],
    conflicts: [{ path: 'src/nested/conflicted.ts', status: 'conflict' }],
  });

  assert.equal(decorations.get('src')?.label, 'C');
  assert.equal(decorations.get('src/nested')?.label, 'C');
});

test('inherits whole-folder Git states for visible descendants', () => {
  const decorations = createExplorerGitDecorations({
    isRepo: true,
    branch: 'main',
    staged: [],
    unstaged: [],
    untracked: [{ path: 'generated', status: 'untracked' }],
    conflicts: [],
  });

  assert.equal(getExplorerGitDecoration('generated', decorations)?.label, 'U');
  assert.equal(getExplorerGitDecoration('generated/assets/logo.svg', decorations)?.label, 'U');
  assert.equal(getExplorerGitDecoration('src/index.ts', decorations), undefined);
});
