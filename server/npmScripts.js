import fs from 'fs';
import path from 'path';
import { detectPackageManager } from './dependencies/detectPackageManager.js';

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

function readPackageScripts(packagePath, workspaceRoot) {
  try {
    const parsed = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const scripts = parsed?.scripts;
    if (!scripts || typeof scripts !== 'object') return null;

    const directory = path.dirname(packagePath);
    const relativeDirectory = path.relative(workspaceRoot, directory).replace(/\\/g, '/') || '.';
    return {
      directory: relativeDirectory,
      name: typeof parsed.name === 'string' && parsed.name ? parsed.name : path.basename(directory),
      packageManager: detectPackageManager(directory),
      scripts: Object.entries(scripts)
        .filter(([, command]) => typeof command === 'string')
        .map(([name, command]) => ({ name, command })),
    };
  } catch {
    return null;
  }
}

export function findNpmScripts(workspaceRoot, maxDepth = 5) {
  const packages = [];

  function walk(directory, depth) {
    if (depth > maxDepth) return;

    const packagePath = path.join(directory, 'package.json');
    if (fs.existsSync(packagePath)) {
      const packageScripts = readPackageScripts(packagePath, workspaceRoot);
      if (packageScripts?.scripts.length) packages.push(packageScripts);
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
