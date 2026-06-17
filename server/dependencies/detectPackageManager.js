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
  if (fs.existsSync(path.join(directory, 'package-lock.json'))) return 'npm';
  if (fs.existsSync(path.join(directory, 'pnpm-lock.yaml'))) return 'pnpm';
  if (fs.existsSync(path.join(directory, 'yarn.lock'))) return 'yarn';
  if (fs.existsSync(path.join(directory, 'bun.lockb')) || fs.existsSync(path.join(directory, 'bun.lock'))) return 'bun';
  return 'npm';
}
