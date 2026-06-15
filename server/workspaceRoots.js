import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const PREFIX = '@root/';

function rootId(rootPath) {
  return crypto.createHash('sha256').update(path.resolve(rootPath).toLowerCase()).digest('hex').slice(0, 12);
}

export function createWorkspaceRoots(primaryPath, storageDirectory) {
  const statePath = path.join(storageDirectory, 'workspace-roots.json');
  let extraPaths = [];
  try {
    const parsed = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    extraPaths = Array.isArray(parsed) ? parsed.filter(item => typeof item === 'string') : [];
  } catch {}

  const getRoots = () => [primaryPath(), ...extraPaths]
    .map(item => path.resolve(item))
    .filter((item, index, list) => list.indexOf(item) === index && fs.existsSync(item))
    .map((rootPath, index) => ({
      id: rootId(rootPath),
      name: path.basename(rootPath),
      path: rootPath,
      primary: index === 0,
    }));

  const save = () => {
    fs.mkdirSync(storageDirectory, { recursive: true });
    fs.writeFileSync(statePath, JSON.stringify(extraPaths, null, 2), 'utf8');
  };

  const add = rootPath => {
    const resolved = path.resolve(String(rootPath || ''));
    if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) throw new Error('Directory not found');
    if (resolved !== path.resolve(primaryPath()) && !extraPaths.includes(resolved)) {
      extraPaths.push(resolved);
      save();
    }
    return getRoots();
  };

  const remove = id => {
    extraPaths = extraPaths.filter(item => rootId(item) !== id);
    save();
    return getRoots();
  };

  const resolve = requestedPath => {
    const value = String(requestedPath || '').replace(/\\/g, '/');
    if (!value.startsWith(PREFIX)) return { root: path.resolve(primaryPath()), path: value, rootId: rootId(primaryPath()) };
    const [, id, ...rest] = value.split('/');
    const selected = getRoots().find(item => item.id === id);
    if (!selected) throw new Error('INVALID_ROOT');
    return { root: selected.path, path: rest.join('/'), rootId: selected.id };
  };

  const virtualPath = (id, relativePath = '') => `${PREFIX}${id}${relativePath ? `/${relativePath}` : ''}`;
  return { add, getRoots, remove, resolve, virtualPath };
}
