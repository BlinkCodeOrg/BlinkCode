import fs from 'fs';
import os from 'os';
import path from 'path';
import { resolveWorkspacePath } from './pathSafety.js';

function copyThenRemove(source, destination) {
  fs.cpSync(source, destination, { recursive: true, errorOnExist: true });
  fs.rmSync(source, { recursive: true, force: true });
}

export function trashWorkspaceEntry(root, requestedPath, trashBase = null) {
  const source = resolveWorkspacePath(root, requestedPath);
  if (!source || !fs.existsSync(source)) throw new Error('NOT_FOUND');

  const trashRoot = path.join(
    trashBase || path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'BlinkCode', 'Trash'),
    path.basename(root),
  );
  fs.mkdirSync(trashRoot, { recursive: true });
  const destination = path.join(trashRoot, `${Date.now()}-${path.basename(source)}`);

  try {
    fs.renameSync(source, destination);
  } catch (error) {
    if (error?.code !== 'EXDEV') throw error;
    copyThenRemove(source, destination);
  }
  return destination;
}
