import fs from 'fs';
import path from 'path';
import { LARGE_TEXT_FILE_LIMIT } from './fileLimits.js';
import { resolveWorkspacePath } from './pathSafety.js';

function workspacePath(root, requestedPath) {
  const resolved = resolveWorkspacePath(root, requestedPath);
  if (!resolved) throw new Error('INVALID_PATH');
  return resolved;
}

function relativePath(root, fullPath) {
  return path.relative(root, fullPath).replace(/\\/g, '/');
}

export function readWorkspaceFile(root, requestedPath) {
  const fullPath = workspacePath(root, requestedPath);
  if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) throw new Error('NOT_FOUND');
  const stat = fs.statSync(fullPath);
  if (stat.size > LARGE_TEXT_FILE_LIMIT) {
    const error = new Error('FILE_TOO_LARGE');
    error.size = stat.size;
    throw error;
  }
  const buffer = fs.readFileSync(fullPath);
  const binary = buffer.length > 0 && buffer.some(byte => byte < 8 && byte !== 0x09 && byte !== 0x0A && byte !== 0x0D);
  return {
    content: binary ? `base64:${buffer.toString('base64')}` : buffer.toString('utf8'),
    binary,
  };
}

export function writeWorkspaceFile(root, requestedPath, content) {
  const fullPath = workspacePath(root, requestedPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, String(content ?? ''), 'utf8');
  return { path: relativePath(root, fullPath) };
}

export function createWorkspaceEntry(root, requestedPath, type) {
  const fullPath = workspacePath(root, requestedPath);
  if (fs.existsSync(fullPath)) throw new Error('ALREADY_EXISTS');
  if (type === 'folder') {
    fs.mkdirSync(fullPath, { recursive: true });
  } else if (type === 'file') {
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, '', 'utf8');
  } else {
    throw new Error('INVALID_TYPE');
  }
  return { path: relativePath(root, fullPath), type };
}

export function deleteWorkspaceEntry(root, requestedPath) {
  const fullPath = workspacePath(root, requestedPath);
  if (!fs.existsSync(fullPath)) throw new Error('NOT_FOUND');
  fs.rmSync(fullPath, { recursive: true, force: true });
}

export function renameWorkspaceEntry(root, requestedPath, newName) {
  const source = workspacePath(root, requestedPath);
  if (!fs.existsSync(source)) throw new Error('NOT_FOUND');
  if (!newName || path.basename(newName) !== newName) throw new Error('INVALID_NAME');
  const destination = workspacePath(root, path.relative(root, path.join(path.dirname(source), newName)));
  if (fs.existsSync(destination)) throw new Error('ALREADY_EXISTS');
  fs.renameSync(source, destination);
  return { newPath: relativePath(root, destination) };
}

export function moveWorkspaceEntry(root, sourcePath, targetPath, position) {
  const source = workspacePath(root, sourcePath);
  if (!fs.existsSync(source)) throw new Error('NOT_FOUND');
  const name = path.basename(source);
  let destination;

  if (position === 'inside' && targetPath) {
    const target = workspacePath(root, targetPath);
    if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) throw new Error('INVALID_TARGET');
    destination = path.join(target, name);
  } else if (targetPath) {
    const target = workspacePath(root, targetPath);
    destination = path.join(path.dirname(target), name);
  } else {
    destination = path.join(root, name);
  }

  destination = workspacePath(root, path.relative(root, destination));
  if (source === destination) return { newPath: relativePath(root, source) };
  const sourceStat = fs.statSync(source);
  if (sourceStat.isDirectory()) {
    const relative = path.relative(source, destination);
    if (relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))) {
      throw new Error('INVALID_TARGET');
    }
  }
  if (fs.existsSync(destination)) throw new Error('ALREADY_EXISTS');
  fs.renameSync(source, destination);
  return { newPath: relativePath(root, destination) };
}
