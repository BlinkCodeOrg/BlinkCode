import fs from 'fs';
import path from 'path';
import { detectPackageManager } from './dependencies/detectPackageManager.js';
import { findNpmScripts } from './npmScripts.js';

const IGNORED_DIRECTORIES = new Set([
  '.git',
  '.next',
  '.nuxt',
  '.svelte-kit',
  '.turbo',
  'build',
  'coverage',
  'dist',
  'node_modules',
  'release',
]);

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function fileExists(root, relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function findFiles(root, predicate, maxDepth = 4) {
  const matches = [];
  function walk(directory, depth) {
    if (depth > maxDepth) return;
    let entries;
    try {
      entries = fs.readdirSync(directory, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (IGNORED_DIRECTORIES.has(entry.name) || entry.name.startsWith('.')) continue;
        walk(path.join(directory, entry.name), depth + 1);
        continue;
      }
      const fullPath = path.join(directory, entry.name);
      const relativePath = path.relative(root, fullPath).replace(/\\/g, '/');
      if (predicate(entry.name, relativePath, fullPath)) matches.push(relativePath);
    }
  }
  walk(root, 0);
  return matches.sort();
}

function dependencyNames(manifest) {
  return new Set([
    ...Object.keys(manifest?.dependencies || {}),
    ...Object.keys(manifest?.devDependencies || {}),
    ...Object.keys(manifest?.peerDependencies || {}),
    ...Object.keys(manifest?.optionalDependencies || {}),
  ]);
}

function detectFrameworks(root, manifest) {
  const deps = dependencyNames(manifest);
  const scripts = manifest?.scripts || {};
  const hasViteConfig = ['vite.config.ts', 'vite.config.js', 'vite.config.mts', 'vite.config.mjs'].some(file => fileExists(root, file));
  const hasTailwindConfig = [
    'tailwind.config.ts',
    'tailwind.config.js',
    'tailwind.config.cjs',
    'tailwind.config.mjs',
  ].some(file => fileExists(root, file));

  return {
    react: deps.has('react') || deps.has('@vitejs/plugin-react'),
    vite: deps.has('vite') || hasViteConfig || Object.values(scripts).some(command => String(command).includes('vite')),
    typescript: deps.has('typescript') || fileExists(root, 'tsconfig.json'),
    tailwind: deps.has('tailwindcss') || hasTailwindConfig,
    reactRouter: deps.has('react-router') || deps.has('react-router-dom'),
    next: deps.has('next') || fileExists(root, 'next.config.js') || fileExists(root, 'next.config.mjs') || fileExists(root, 'next.config.ts'),
    vue: deps.has('vue') || deps.has('@vitejs/plugin-vue'),
    svelte: deps.has('svelte') || deps.has('@sveltejs/kit') || fileExists(root, 'svelte.config.js'),
  };
}

function detectTesting(manifest) {
  const deps = dependencyNames(manifest);
  return {
    vitest: deps.has('vitest'),
    jest: deps.has('jest'),
    playwright: deps.has('@playwright/test') || deps.has('playwright'),
  };
}

function detectBackend(manifest) {
  const deps = dependencyNames(manifest);
  return {
    express: deps.has('express'),
    fastify: deps.has('fastify'),
    hono: deps.has('hono'),
  };
}

function inferDevServerScripts(packages) {
  const devNames = new Set(['dev', 'start', 'serve', 'preview']);
  return packages.flatMap(npmPackage => npmPackage.scripts
    .filter(script => devNames.has(script.name) || /vite|next dev|webpack|astro|svelte-kit|nuxt dev/i.test(script.command))
    .map(script => ({
      packageDirectory: npmPackage.directory,
      packageName: npmPackage.name,
      scriptName: script.name,
      command: script.command,
      packageManager: npmPackage.packageManager,
    })));
}

function readPackageSummaries(workspaceRoot) {
  const packages = [];
  const npmPackages = findNpmScripts(workspaceRoot, 5);
  for (const npmPackage of npmPackages) {
    const directory = npmPackage.directory === '.' ? workspaceRoot : path.join(workspaceRoot, npmPackage.directory);
    const manifest = readJson(path.join(directory, 'package.json')) || {};
    packages.push({
      ...npmPackage,
      frameworks: detectFrameworks(directory, manifest),
      testing: detectTesting(manifest),
      backend: detectBackend(manifest),
      hasLockfile: ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lockb', 'bun.lock'].some(file => fileExists(directory, file)),
      packageManager: detectPackageManager(directory),
    });
  }
  return packages;
}

export function analyzeWebWorkflow(workspaceRoot) {
  const packages = readPackageSummaries(workspaceRoot);
  const envFiles = findFiles(workspaceRoot, name => name === '.env' || name.startsWith('.env.'), 3);
  const restFiles = findFiles(workspaceRoot, name => name.endsWith('.http') || name.endsWith('.rest'), 4);
  const allFrameworks = packages.reduce((acc, item) => {
    for (const [key, value] of Object.entries(item.frameworks)) acc[key] ||= Boolean(value);
    return acc;
  }, {});
  const allTesting = packages.reduce((acc, item) => {
    for (const [key, value] of Object.entries(item.testing)) acc[key] ||= Boolean(value);
    return acc;
  }, {});
  const allBackend = packages.reduce((acc, item) => {
    for (const [key, value] of Object.entries(item.backend)) acc[key] ||= Boolean(value);
    return acc;
  }, {});

  return {
    workspaceName: path.basename(workspaceRoot),
    packages,
    frameworks: allFrameworks,
    testing: allTesting,
    backend: allBackend,
    envFiles,
    restFiles,
    devServerScripts: inferDevServerScripts(packages),
    generatedAt: new Date().toISOString(),
  };
}
