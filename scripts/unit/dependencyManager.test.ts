import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import test from 'node:test';
import { findDependencyPackages } from '../../server/dependencies/findDependencyPackages.js';
import { getPackageManagerInvocation } from '../../server/dependencies/getPackageManagerInvocation.js';
import { isMissingRegistryPackageError } from '../../server/dependencies/isMissingRegistryPackageError.js';
import { parseOutdatedOutput } from '../../server/dependencies/parseOutdatedOutput.js';
import { createDependencyCommand } from '../../src/features/dependencies/createDependencyCommand';

test('discovers root and nested dependency manifests with installed versions', () => {
  const workspace = mkdtempSync(resolve(tmpdir(), 'blinkcode-dependencies-'));
  try {
    writeFileSync(resolve(workspace, 'package.json'), JSON.stringify({
      name: 'root-package',
      dependencies: { react: '^19.0.0' },
      devDependencies: { typescript: '^6.0.0' },
    }));
    mkdirSync(resolve(workspace, 'node_modules/react'), { recursive: true });
    writeFileSync(resolve(workspace, 'node_modules/react/package.json'), JSON.stringify({ version: '19.2.4' }));
    mkdirSync(resolve(workspace, 'packages/client'), { recursive: true });
    writeFileSync(resolve(workspace, 'packages/client/package.json'), JSON.stringify({
      name: 'client-package',
      optionalDependencies: { sharp: '^1.0.0' },
    }));

    const packages = findDependencyPackages(workspace);
    assert.equal(packages.length, 2);
    assert.deepEqual(packages[0].dependencies, [
      { name: 'react', declaredVersion: '^19.0.0', installedVersion: '19.2.4', type: 'production' },
      { name: 'typescript', declaredVersion: '^6.0.0', installedVersion: null, type: 'development' },
    ]);
    assert.equal(packages[1].directory, 'packages/client');
    assert.equal(packages[1].dependencies[0].type, 'optional');
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test('normalizes object, array and Yarn table outdated output', () => {
  assert.deepEqual(parseOutdatedOutput(JSON.stringify({
    react: { current: '18.0.0', wanted: '18.3.0', latest: '19.0.0' },
  })), [{ name: 'react', current: '18.0.0', wanted: '18.3.0', latest: '19.0.0' }]);

  assert.deepEqual(parseOutdatedOutput(JSON.stringify([
    { name: 'vite', version: '6.0.0', latestVersion: '8.0.0' },
  ])), [{ name: 'vite', current: '6.0.0', wanted: null, latest: '8.0.0' }]);

  assert.deepEqual(parseOutdatedOutput(JSON.stringify({
    type: 'table',
    data: { body: [['eslint', '8.0.0', '8.1.0', '9.0.0']] },
  })), [{ name: 'eslint', current: '8.0.0', wanted: '8.1.0', latest: '9.0.0' }]);
});

test('creates package-manager-native dependency commands', () => {
  assert.equal(createDependencyCommand('npm', 'install', 'vitest', 'development'), "npm install 'vitest' --save-dev");
  assert.equal(createDependencyCommand('pnpm', 'update', 'react'), "pnpm add 'react@latest'");
  assert.equal(createDependencyCommand('yarn', 'remove', '@types/node'), "yarn remove '@types/node'");
  assert.equal(createDependencyCommand('bun', 'install', "test'pkg"), "bun add 'test''pkg'");
});

test('uses command shims through cmd.exe on Windows', () => {
  assert.deepEqual(getPackageManagerInvocation('npm', 'win32'), {
    command: process.env.ComSpec || 'cmd.exe',
    prefixArgs: ['/d', '/s', '/c', 'npm.cmd'],
  });
  assert.deepEqual(getPackageManagerInvocation('pnpm', 'linux'), {
    command: 'pnpm',
    prefixArgs: [],
  });
});

test('recognizes missing registry packages without treating them as server failures', () => {
  assert.equal(isMissingRegistryPackageError('npm error code E404'), true);
  assert.equal(isMissingRegistryPackageError('404 Not Found - GET https://registry.npmjs.org/missing'), true);
  assert.equal(isMissingRegistryPackageError('Package is not in this registry.'), true);
  assert.equal(isMissingRegistryPackageError('ECONNRESET while contacting registry'), false);
});
