import fs from 'fs';
import path from 'path';

export function detectPackageManager(directory) {
  if (fs.existsSync(path.join(directory, 'pnpm-lock.yaml'))) return 'pnpm';
  if (fs.existsSync(path.join(directory, 'yarn.lock'))) return 'yarn';
  if (fs.existsSync(path.join(directory, 'bun.lockb')) || fs.existsSync(path.join(directory, 'bun.lock'))) return 'bun';
  return 'npm';
}
