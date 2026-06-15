import { spawnSync } from 'node:child_process';
import electronPath from 'electron';

const result = spawnSync(
  electronPath,
  ['-e', "require('better-sqlite3'); console.log(process.versions.modules)"],
  {
    encoding: 'utf8',
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
    },
  },
);

if (result.status !== 0) {
  process.stderr.write(result.stderr || result.stdout || 'Electron native module verification failed.\n');
  process.exit(result.status || 1);
}

process.stdout.write(`Electron native modules verified for ABI ${result.stdout.trim()}.\n`);
