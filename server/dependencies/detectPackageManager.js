import fs from 'fs';
import path from 'path';

function packageManagerFromManifest(directory) {
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8'));
    const value = typeof manifest.packageManager === 'string' ? manifest.packageManager : '';
    if (value.startsWith('pnpm@')) return 'pnpm';
    if (value.startsWith('yarn@')) return 'yarn';
    if (value.startsWith('bun@')) return 'bun';
    if (value.startsWith('npm@')) return 'npm';
  } catch {}
  return null;
}

export function detectPackageManager(directory) {
  const declared = packageManagerFromManifest(directory);
  if (declared) return declared;
  const hasNpmLock = fs.existsSync(path.join(directory, 'package-lock.json')) || fs.existsSync(path.join(directory, 'npm-shrinkwrap.json'));
  const hasPnpmLock = fs.existsSync(path.join(directory, 'pnpm-lock.yaml'));
  const hasYarnLock = fs.existsSync(path.join(directory, 'yarn.lock'));
  const hasBunLock = fs.existsSync(path.join(directory, 'bun.lockb')) || fs.existsSync(path.join(directory, 'bun.lock'));

  if (hasNpmLock) return 'npm';
  if (hasPnpmLock) return 'pnpm';
  if (hasYarnLock) return 'yarn';
  if (hasBunLock) return 'bun';
  return 'npm';
}
