import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

export async function createDefaultLaunchConfiguration(workspaceRoot, activeFile = '') {
  const directory = path.join(workspaceRoot, '.blinkcode');
  const launchPath = path.join(directory, 'launch.json');
  const program = activeFile || '${file}';
  const document = {
    version: '1.0',
    configurations: [{
      type: 'node',
      request: 'launch',
      name: 'Launch current file',
      program,
      cwd: '${workspaceRoot}',
      skipFiles: ['<node_internals>/**'],
    }],
  };
  await mkdir(directory, { recursive: true });
  await writeFile(launchPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  return document.configurations;
}
