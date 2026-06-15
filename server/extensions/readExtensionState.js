import fs from 'node:fs';
import path from 'node:path';

export function readExtensionState(statePath, defaults) {
  try {
    const parsed = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    return parsed && typeof parsed === 'object' ? parsed : defaults;
  } catch {
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    fs.writeFileSync(statePath, `${JSON.stringify(defaults, null, 2)}\n`, 'utf8');
    return defaults;
  }
}
