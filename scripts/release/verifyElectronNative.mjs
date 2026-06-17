import { spawnSync } from 'node:child_process';
import electronPath from 'electron';
import os from 'node:os';
import path from 'node:path';

const storageDir = process.env.BLINKCODE_RELEASE_CHECK_STORAGE_DIR
  || path.join(os.tmpdir(), `blinkcode-release-check-${Date.now()}`);

const result = spawnSync(
  electronPath,
  ['-e', "import('./server/db.js').then(db => { db.saveState({ releaseCheck: true }); db.saveWorkspacePath(''); console.log(process.versions.modules); }).catch(error => { console.error(error); process.exit(1); })"],
  {
    encoding: 'utf8',
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      BLINKCODE_STORAGE_DIR: storageDir,
    },
  },
);

if (result.status !== 0) {
  process.stderr.write(result.stderr || result.stdout || 'Electron native module verification failed.\n');
  process.exit(result.status || 1);
}

process.stdout.write(`Electron storage layer verified for ABI ${result.stdout.trim()}.\n`);
