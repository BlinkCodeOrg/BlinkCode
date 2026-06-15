import fs from 'node:fs';
import path from 'node:path';
import { validateExtensionManifest } from './validateExtensionManifest.js';

const MANIFEST_NAMES = ['bcode.json', 'blinkcode-extension.json'];

export function readExtensionManifest(directory) {
  const manifestName = MANIFEST_NAMES.find(name => fs.existsSync(path.join(directory, name)));
  if (!manifestName) throw new Error(`Extension manifest was not found in ${directory}`);
  return validateExtensionManifest(
    JSON.parse(fs.readFileSync(path.join(directory, manifestName), 'utf8')),
  );
}
