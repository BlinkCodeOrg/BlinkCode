import { readFile } from 'fs/promises';
import path from 'path';
import { parseJsonc } from './parseJsonc.js';

export async function loadDebugConfigurations(workspaceRoot) {
  const launchPath = path.join(workspaceRoot, '.blinkcode', 'launch.json');
  try {
    const document = parseJsonc(await readFile(launchPath, 'utf8'));
    const configurations = Array.isArray(document?.configurations)
      ? document.configurations.filter(item => item && typeof item === 'object' && item.name)
      : [];
    return { exists: true, path: '.blinkcode/launch.json', configurations };
  } catch (error) {
    if (error?.code === 'ENOENT') return { exists: false, path: '.blinkcode/launch.json', configurations: [] };
    throw new Error(`Invalid .blinkcode/launch.json: ${error?.message || error}`);
  }
}
