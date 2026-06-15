import fs from 'fs';
import path from 'path';

function decodePath(value) {
  let decoded = value;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      return null;
    }
  }
  return decoded;
}

function isInside(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function nearestExistingParent(candidate) {
  let current = candidate;
  while (!fs.existsSync(current)) {
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
  return current;
}

export function resolveWorkspacePath(workspaceRoot, requestedPath) {
  if (typeof requestedPath !== 'string') return null;

  const decoded = decodePath(requestedPath);
  if (decoded === null || decoded.includes('\0')) return null;
  const root = path.resolve(workspaceRoot);
  const resolved = path.resolve(root, decoded);
  if (!isInside(root, resolved)) return null;
  if (!fs.existsSync(root)) return resolved;

  try {
    const realRoot = fs.realpathSync(root);
    if (fs.existsSync(resolved)) {
      return isInside(realRoot, fs.realpathSync(resolved)) ? resolved : null;
    }
    const existingParent = nearestExistingParent(resolved);
    if (existingParent && !isInside(realRoot, fs.realpathSync(existingParent))) return null;
  } catch {
    return null;
  }

  return resolved;
}
