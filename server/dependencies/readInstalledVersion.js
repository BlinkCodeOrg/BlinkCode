import fs from 'fs';
import path from 'path';

export function readInstalledVersion(directory, dependencyName) {
  try {
    const manifestPath = path.join(directory, 'node_modules', ...dependencyName.split('/'), 'package.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    return typeof manifest.version === 'string' ? manifest.version : null;
  } catch {
    return null;
  }
}
