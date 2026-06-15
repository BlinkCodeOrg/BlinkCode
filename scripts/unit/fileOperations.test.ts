import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import test from 'node:test';
import {
  createWorkspaceEntry,
  deleteWorkspaceEntry,
  moveWorkspaceEntry,
  readWorkspaceFile,
  renameWorkspaceEntry,
  writeWorkspaceFile,
} from '../../server/fileOperations.js';

function workspaceTest(name: string, run: (workspace: string) => void) {
  test(name, () => {
    const workspace = mkdtempSync(resolve(tmpdir(), 'blinkcode-files-'));
    try {
      run(workspace);
    } finally {
      rmSync(workspace, { recursive: true, force: true });
    }
  });
}

workspaceTest('create, write and read a nested text file', workspace => {
  createWorkspaceEntry(workspace, 'src', 'folder');
  createWorkspaceEntry(workspace, 'src/index.ts', 'file');
  writeWorkspaceFile(workspace, 'src/index.ts', 'export const value = 1;\n');
  assert.deepEqual(readWorkspaceFile(workspace, 'src/index.ts'), {
    content: 'export const value = 1;\n',
    binary: false,
  });
});

workspaceTest('binary reads are returned as base64', workspace => {
  writeFileSync(resolve(workspace, 'binary.dat'), Buffer.from([0, 1, 2, 3]));
  const result = readWorkspaceFile(workspace, 'binary.dat');
  assert.equal(result.binary, true);
  assert.match(result.content, /^base64:/);
});

workspaceTest('rename returns a normalized relative path and preserves content', workspace => {
  writeWorkspaceFile(workspace, 'old.txt', 'content');
  assert.deepEqual(renameWorkspaceEntry(workspace, 'old.txt', 'new.txt'), { newPath: 'new.txt' });
  assert.equal(existsSync(resolve(workspace, 'old.txt')), false);
  assert.equal(readFileSync(resolve(workspace, 'new.txt'), 'utf8'), 'content');
});

workspaceTest('move supports moving a file into a folder', workspace => {
  createWorkspaceEntry(workspace, 'target', 'folder');
  writeWorkspaceFile(workspace, 'move.txt', 'move me');
  assert.deepEqual(
    moveWorkspaceEntry(workspace, 'move.txt', 'target', 'inside'),
    { newPath: 'target/move.txt' },
  );
  assert.equal(readFileSync(resolve(workspace, 'target/move.txt'), 'utf8'), 'move me');
});

workspaceTest('delete removes files and folders recursively', workspace => {
  writeWorkspaceFile(workspace, 'folder/nested/file.txt', 'value');
  deleteWorkspaceEntry(workspace, 'folder');
  assert.equal(existsSync(resolve(workspace, 'folder')), false);
});

workspaceTest('file operations reject traversal and invalid rename names', workspace => {
  writeWorkspaceFile(workspace, 'file.txt', 'value');
  assert.throws(() => writeWorkspaceFile(workspace, '../outside.txt', 'no'), /INVALID_PATH/);
  assert.throws(() => renameWorkspaceEntry(workspace, 'file.txt', '../outside.txt'), /INVALID_NAME/);
});

workspaceTest('create and move reject collisions', workspace => {
  writeWorkspaceFile(workspace, 'one.txt', 'one');
  writeWorkspaceFile(workspace, 'two.txt', 'two');
  writeWorkspaceFile(workspace, 'nested/one.txt', 'nested one');
  assert.throws(() => createWorkspaceEntry(workspace, 'one.txt', 'file'), /ALREADY_EXISTS/);
  assert.throws(() => moveWorkspaceEntry(workspace, 'nested/one.txt', 'two.txt', 'after'), /ALREADY_EXISTS/);
});

workspaceTest('folders cannot be moved inside themselves', workspace => {
  createWorkspaceEntry(workspace, 'folder', 'folder');
  createWorkspaceEntry(workspace, 'folder/child', 'folder');
  assert.throws(
    () => moveWorkspaceEntry(workspace, 'folder', 'folder/child', 'inside'),
    /INVALID_TARGET/,
  );
});
