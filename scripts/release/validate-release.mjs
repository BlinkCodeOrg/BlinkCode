import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const errors = [];

if (!/^\d+\.\d+\.\d+$/.test(packageJson.version || '')) {
  errors.push('package.json version must use x.y.z format.');
}

for (const relativePath of [
  'build/icon.ico',
  'build/icon.png',
  'CHANGELOG.md',
  'docs/QUALITY.md',
  'docs/RELEASE.md',
  'electron/main.mjs',
  'electron/preload.cjs',
  '.github/workflows/quality.yml',
]) {
  if (!existsSync(resolve(root, relativePath))) {
    errors.push(`Missing required release file: ${relativePath}`);
  }
}

for (const script of ['quality', 'dist:win:setup', 'dist:win:portable', 'dist:mac', 'dist:linux']) {
  if (!packageJson.scripts?.[script]) {
    errors.push(`Missing npm script: ${script}`);
  }
}

const changelog = readFileSync(resolve(root, 'CHANGELOG.md'), 'utf8');
if (!changelog.includes('## [Unreleased]')) {
  errors.push('CHANGELOG.md must contain an [Unreleased] section.');
}

if (errors.length > 0) {
  console.error('Release validation failed:\n');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Release validation passed for BlinkCode ${packageJson.version}.`);
