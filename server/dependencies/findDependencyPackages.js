import fs from 'fs';
import path from 'path';
import { detectPackageManager } from './detectPackageManager.js';
import { readInstalledVersion } from './readInstalledVersion.js';

const IGNORED_DIRECTORIES = new Set([
  '.git',
  '.cache',
  '.next',
  'build',
  'coverage',
  'dist',
  'node_modules',
  'release',
]);

const DEPENDENCY_GROUPS = [
  ['dependencies', 'production'],
  ['devDependencies', 'development'],
  ['optionalDependencies', 'optional'],
  ['peerDependencies', 'peer'],
];

function readDependencyPackage(packagePath, workspaceRoot) {
  try {
    const parsed = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const directory = path.dirname(packagePath);
    const dependencies = DEPENDENCY_GROUPS.flatMap(([manifestKey, type]) => {
      const group = parsed?.[manifestKey];
      if (!group || typeof group !== 'object') return [];
      return Object.entries(group)
        .filter(([, version]) => typeof version === 'string')
        .map(([name, declaredVersion]) => ({
          name,
          declaredVersion,
          installedVersion: readInstalledVersion(directory, name),
          type,
        }));
    }).sort((left, right) => left.name.localeCompare(right.name));

    return {
      directory: path.relative(workspaceRoot, directory).replace(/\\/g, '/') || '.',
      name: typeof parsed.name === 'string' && parsed.name ? parsed.name : path.basename(directory),
      packageManager: detectPackageManager(directory),
      dependencies,
    };
  } catch {
    return null;
  }
}

export function findDependencyPackages(workspaceRoot, maxDepth = 5) {
  const packages = [];

  function walk(directory, depth) {
    if (depth > maxDepth) return;

    const packagePath = path.join(directory, 'package.json');
    if (fs.existsSync(packagePath)) {
      const dependencyPackage = readDependencyPackage(packagePath, workspaceRoot);
      if (dependencyPackage) packages.push(dependencyPackage);
    }

    let entries;
    try {
      entries = fs.readdirSync(directory, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (!entry.isDirectory() || IGNORED_DIRECTORIES.has(entry.name) || entry.name.startsWith('.')) continue;
      walk(path.join(directory, entry.name), depth + 1);
    }
  }

  walk(workspaceRoot, 0);
  return packages.sort((left, right) => left.directory.localeCompare(right.directory));
}
