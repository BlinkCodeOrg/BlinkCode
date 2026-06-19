import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import chokidar from 'chokidar';
import { execFile, execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import {
  addRecentProject,
  deleteRecoveryBuffer,
  deleteRecoveryBuffers,
  loadFileCursorPosition,
  loadRecentProjects,
  loadRecoveryBuffers,
  loadState,
  loadWorkspacePath,
  saveFileCursorPosition,
  saveRecoveryBuffer,
  saveState,
  saveWorkspacePath,
} from './db.js';
import { createPtyManager } from './pty.js';
import { attachLspBridge, parseLspUrl } from './lsp.js';
import {
  defaultSettings,
  loadGlobalSettings,
  loadWorkspaceSettings,
  loadMergedSettings,
  saveGlobalSettings,
  saveWorkspaceSettingsFile,
  getGlobalSettingsPath,
  getWorkspaceSettingsPath,
  loadGlobalSettingsRaw,
  saveGlobalSettingsRaw,
  loadWorkspaceSettingsRaw,
  saveWorkspaceSettingsRaw,
} from './settings.js';
import { searchWorkspace, replaceWorkspace, replaceWorkspaceMatch } from './search.js';
import { resolveWorkspacePath } from './pathSafety.js';
import { LARGE_TEXT_FILE_LIMIT } from './fileLimits.js';
import { securityHeaders } from './securityHeaders.js';
import { findNpmScripts } from './npmScripts.js';
import { analyzeWebWorkflow } from './webWorkflow.js';
import { registerDebuggerRoutes } from './debugger/registerDebuggerRoutes.js';
import { registerRestClientRoutes } from './restClient/registerRestClientRoutes.js';
import { registerAiRoutes } from './ai/registerAiRoutes.js';
import { findDependencyPackages } from './dependencies/findDependencyPackages.js';
import { getOutdatedDependencies } from './dependencies/getOutdatedDependencies.js';
import {
  createWorkspaceEntry,
  deleteWorkspaceEntry,
  moveWorkspaceEntry,
  readWorkspaceFile,
  renameWorkspaceEntry,
  writeWorkspaceFile,
} from './fileOperations.js';
import { trashWorkspaceEntry } from './trashWorkspaceEntry.js';
import { resolveEditorConfig } from './editorConfig.js';
import { createWorkspaceRoots } from './workspaceRoots.js';
import { createExtensionService } from './extensions/createExtensionService.js';
import { registerExtensionRoutes } from './extensions/registerExtensionRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(securityHeaders);
app.use(express.json({ limit: '50mb' }));

const isPackaged = __dirname.includes('app.asar');
const userDataDir = path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'BlinkCode');
const storageRoot = isPackaged ? userDataDir : path.join(__dirname, '..');

const configuredWorkspace = process.env.BLINKCODE_WORKSPACE;
let workspace = configuredWorkspace
  ? path.resolve(configuredWorkspace)
  : path.join(storageRoot, 'workspace');

if (!fs.existsSync(workspace)) {
  fs.mkdirSync(workspace, { recursive: true });
}

const savedWorkspace = configuredWorkspace ? null : loadWorkspacePath();
if (savedWorkspace && fs.existsSync(savedWorkspace)) {
  try {
    const stat = fs.statSync(savedWorkspace);
    if (stat.isDirectory()) workspace = path.resolve(savedWorkspace);
  } catch {}
}
const workspaceRoots = createWorkspaceRoots(() => workspace, process.env.BLINKCODE_STORAGE_DIR || userDataDir);
const userMarketplaceRoot = path.join(
  process.env.BLINKCODE_STORAGE_DIR || userDataDir,
  'extensions',
  'marketplace',
);
const extensionService = createExtensionService({
  marketplaceRoots: [
    path.join(__dirname, '..', 'extensions', 'marketplace'),
    userMarketplaceRoot,
  ],
  statePath: path.join(process.env.BLINKCODE_STORAGE_DIR || userDataDir, 'extensions-state.json'),
  userMarketplaceRoot,
});

function safePath(p) {
  try {
    const target = workspaceRoots.resolve(p);
    return resolveWorkspacePath(target.root, target.path);
  } catch {
    return null;
  }
}

function readTree(dir, depth = 0, treeRoot = workspace) {
  if (depth > 10) return [];
  const items = [];
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return []; }
  entries.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });
  for (const entry of entries) {
    if (
      entry.name.startsWith('.') &&
      entry.name !== '.gitignore' &&
      entry.name !== '.gitmodules' &&
      entry.name !== '.dockerignore' &&
      !entry.name.startsWith('.env')
    ) continue;
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.cache') continue;
    const fullPath = path.join(dir, entry.name);
    const entryStat = fs.statSync(fullPath);
    const rel = path.relative(treeRoot, fullPath).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      items.push({ name: entry.name, type: 'folder', path: rel, children: readTree(fullPath, depth + 1, treeRoot) });
    } else {
      items.push({ name: entry.name, type: 'file', path: rel, size: entryStat.size });
    }
  }
  return items;
}

app.get('/api/tree', (req, res) => {
  const roots = workspaceRoots.getRoots();
  const tree = roots.length === 1
    ? readTree(workspace)
    : roots.map(root => ({
        name: root.name,
        type: 'folder',
        path: workspaceRoots.virtualPath(root.id),
        root: true,
        children: readTree(root.path, 0, root.path).map(item => prefixTreeItem(item, root.id)),
      }));
  res.json({ tree, roots, workspace: path.basename(workspace), workspacePath: workspace });
});

function prefixTreeItem(item, rootId) {
  return {
    ...item,
    path: workspaceRoots.virtualPath(rootId, item.path),
    children: item.children?.map(child => prefixTreeItem(child, rootId)),
  };
}

app.post('/api/workspace/roots', (req, res) => {
  try {
    const roots = workspaceRoots.add(req.body?.dirPath);
    startFsWatcher();
    res.json({ roots });
  } catch (error) {
    res.status(400).json({ error: error?.message || 'Could not add workspace folder' });
  }
});

app.delete('/api/workspace/roots/:id', (req, res) => {
  res.json({ roots: workspaceRoots.remove(req.params.id) });
});

app.post('/api/trash', (req, res) => {
  try {
    const trashBase = path.join(process.env.BLINKCODE_STORAGE_DIR || userDataDir, 'Trash');
    const target = workspaceRoots.resolve(req.body?.filePath);
    const destination = trashWorkspaceEntry(target.root, target.path, trashBase);
    res.json({ ok: true, destination });
  } catch (error) {
    const status = error?.message === 'NOT_FOUND' ? 404 : 400;
    res.status(status).json({ error: error?.message || 'Trash operation failed' });
  }
});

app.get('/api/editor-config', (req, res) => {
  try {
    const target = workspaceRoots.resolve(req.query.path);
    res.json(resolveEditorConfig(target.root, target.path));
  } catch (error) {
    res.status(400).json({ error: error?.message || 'Could not resolve EditorConfig' });
  }
});

app.get('/api/npm-scripts', (_req, res) => {
  res.json({ packages: findNpmScripts(workspace) });
});

app.get('/api/web-workflow', (_req, res) => {
  res.json(analyzeWebWorkflow(workspace));
});

registerDebuggerRoutes(app, () => workspace);
registerRestClientRoutes(app);
registerAiRoutes(app, () => workspace);
registerExtensionRoutes(app, extensionService);

app.get('/api/dependencies', (_req, res) => {
  res.json({ packages: findDependencyPackages(workspace) });
});

app.get('/api/dependencies/outdated', async (req, res) => {
  const packageDirectory = String(req.query.directory || '.');
  const dependencyPackage = findDependencyPackages(workspace)
    .find(item => item.directory === packageDirectory);
  if (!dependencyPackage) return res.status(404).json({ error: 'Package not found' });

  const directory = safePath(packageDirectory);
  if (!directory) return res.status(400).json({ error: 'Invalid package directory' });
  try {
    const result = await getOutdatedDependencies(directory, dependencyPackage.packageManager);
    res.json(result);
  } catch (error) {
    if (error?.code === 'PACKAGE_MANAGER_TIMEOUT') {
      return res.status(504).json({ error: 'Package registry request timed out. Check your network connection and try again.' });
    }
    if (error?.code === 'PACKAGE_MANAGER_NOT_FOUND') {
      return res.status(503).json({ error: `${dependencyPackage.packageManager} is not available in the server environment.` });
    }
    if (error?.code === 'PACKAGE_REGISTRY_UNAVAILABLE') {
      return res.status(503).json({ error: 'Package registry is unavailable. Check your network or proxy settings.' });
    }
    res.status(500).json({ error: error?.message || 'Outdated check failed' });
  }
});

app.post('/api/upload-folder', (req, res) => {
  const { name, files, targetDir } = req.body;

  if (targetDir && fs.existsSync(targetDir)) {
    try {
      const stat = fs.statSync(targetDir);
      if (stat.isDirectory()) {
        workspace = path.resolve(targetDir);
        saveWorkspacePath(workspace);
        addRecentProject(workspace, path.basename(workspace));
        startFsWatcher();
        res.json({ tree: readTree(workspace), workspace: path.basename(workspace) });
        return;
      }
    } catch {}
  }

  if (!files || !Array.isArray(files)) return res.status(400).json({ error: 'No files' });

  if (fs.existsSync(workspace)) {
    for (const item of fs.readdirSync(workspace)) {
      fs.rmSync(path.join(workspace, item), { recursive: true, force: true });
    }
  }

  for (const file of files) {
    const p = safePath(file.path);
    if (!p) continue;
    if (file.type === 'folder') {
      fs.mkdirSync(p, { recursive: true });
    } else {
      const dir = path.dirname(p);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      if (typeof file.content === 'string' && file.content.startsWith('base64:')) {
        const b64 = file.content.slice(7);
        fs.writeFileSync(p, Buffer.from(b64, 'base64'));
      } else {
        fs.writeFileSync(p, file.content || '', 'utf-8');
      }
    }
  }

  startFsWatcher();
  res.json({ tree: readTree(workspace), workspace: name || path.basename(workspace) });
});

app.post('/api/open-folder', (req, res) => {
  const { dirPath } = req.body;
  if (!dirPath || !fs.existsSync(dirPath)) return res.status(400).json({ error: 'Directory not found' });
  try {
    const stat = fs.statSync(dirPath);
    if (!stat.isDirectory()) return res.status(400).json({ error: 'Not a directory' });
  } catch { return res.status(400).json({ error: 'Cannot access directory' }); }
  workspace = path.resolve(dirPath);
  saveWorkspacePath(workspace);
  addRecentProject(workspace, path.basename(workspace));
  startFsWatcher();
  res.json({ tree: readTree(workspace), workspace: path.basename(workspace) });
});

app.get('/api/recent-projects', (req, res) => {
  res.json({ projects: loadRecentProjects() });
});

app.get('/api/git-branch', (req, res) => {
  if (!workspace) return res.json({ branch: null });
  const gitDir = path.join(workspace, '.git');
  if (!fs.existsSync(gitDir)) return res.json({ branch: null });
  execFile('git', ['branch', '--show-current'], { cwd: workspace }, (err, stdout) => {
    if (err) return res.json({ branch: null });
    const branch = stdout.trim();
    res.json({ branch: branch || null });
  });
});

function runGit(args, cwd, callback) {
  execFile('git', ['-c', `safe.directory=${cwd}`, ...args], { cwd, maxBuffer: 1024 * 1024 }, callback);
}

function getGitWorkspace(req) {
  const root = req.query?.root || req.body?.root;
  if (!root) return workspace;
  try {
    return workspaceRoots.resolve(root).root;
  } catch {
    return null;
  }
}

function safeGitPath(gitWorkspace, filePath) {
  try {
    return resolveWorkspacePath(gitWorkspace, filePath);
  } catch {
    return null;
  }
}

const gitBlameCache = new Map();

app.get('/api/git/status', (req, res) => {
  const gitWorkspace = getGitWorkspace(req);
  const roots = workspaceRoots.getRoots().map(root => ({
    id: root.id,
    name: root.name,
    ref: workspaceRoots.virtualPath(root.id),
    primary: root.primary,
  }));
  const empty = { isRepo: false, branch: null, staged: [], unstaged: [], untracked: [], conflicts: [], roots };
  if (!gitWorkspace) return res.json(empty);
  const gitDir = path.join(gitWorkspace, '.git');
  if (!fs.existsSync(gitDir)) return res.json(empty);

  runGit(['status', '--porcelain=v1', '-z', '--branch'], gitWorkspace, (err, stdout) => {
    if (err) return res.json(empty);

    const entries = stdout.split('\0').filter(Boolean);
    const staged = [];
    const unstaged = [];
    const untracked = [];
    const conflicts = [];
    let branch = null;

    for (const entry of entries) {
      if (entry.startsWith('## ')) {
        const branchPart = entry.slice(3).split('...')[0];
        branch = branchPart || null;
        continue;
      }
      if (entry.length < 4) continue;
      const xy = entry.slice(0, 2);
      const filePath = entry.slice(3);
      const x = xy[0];
      const y = xy[1];

      if (x === 'U' || y === 'U' || xy === 'AA' || xy === 'DD') {
        conflicts.push({ path: filePath, status: 'conflict' });
      } else if (x === '?' && y === '?') {
        untracked.push({ path: filePath, status: 'untracked' });
      } else {
        if (x !== ' ' && x !== '?') {
          staged.push({ path: filePath, status: x === 'A' ? 'added' : x === 'D' ? 'deleted' : 'modified' });
        }
        if (y !== ' ' && y !== '?') {
          unstaged.push({ path: filePath, status: y === 'D' ? 'deleted' : 'modified' });
        }
      }
    }

    res.json({ isRepo: true, branch, staged, unstaged, untracked, conflicts, roots });
  });
});

app.post('/api/git/stage', (req, res) => {
  const gitWorkspace = getGitWorkspace(req);
  if (!gitWorkspace) return res.status(400).json({ error: 'No workspace' });
  const { paths } = req.body;
  const args = paths && paths.length > 0 ? ['add', '--', ...paths] : ['add', '-A'];
  runGit(args, gitWorkspace, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true });
  });
});

app.post('/api/git/unstage', (req, res) => {
  const gitWorkspace = getGitWorkspace(req);
  if (!gitWorkspace) return res.status(400).json({ error: 'No workspace' });
  const { paths } = req.body;
  const args = paths && paths.length > 0 ? ['reset', 'HEAD', '--', ...paths] : ['reset', 'HEAD'];
  runGit(args, gitWorkspace, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true });
  });
});

app.post('/api/git/discard', (req, res) => {
  const gitWorkspace = getGitWorkspace(req);
  if (!gitWorkspace) return res.status(400).json({ error: 'No workspace' });
  const { paths } = req.body;
  if (!paths || paths.length === 0) return res.status(400).json({ error: 'No paths specified' });
  runGit(['checkout', '--', ...paths], gitWorkspace, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true });
  });
});

app.get('/api/git/file-diff', (req, res) => {
  const gitWorkspace = getGitWorkspace(req);
  if (!gitWorkspace) return res.status(400).json({ error: 'No workspace' });
  const gitDir = path.join(gitWorkspace, '.git');
  if (!fs.existsSync(gitDir)) return res.status(400).json({ error: 'Not a Git repository' });

  const filePath = String(req.query.path || '');
  const staged = req.query.staged === 'true';
  const status = String(req.query.status || 'modified');
  const fullPath = safeGitPath(gitWorkspace, filePath);
  if (!filePath || !fullPath) return res.status(400).json({ error: 'Invalid path' });

  const readWorkingTree = () => {
    try {
      return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : '';
    } catch {
      return '';
    }
  };

  const readGitObject = (spec, fallback = '') => {
    try {
      return execFileSync('git', ['show', spec], { cwd: gitWorkspace, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    } catch {
      return fallback;
    }
  };

  const headSpec = `HEAD:${filePath}`;
  const indexSpec = `:${filePath}`;
  const original = status === 'untracked'
    ? ''
    : staged
      ? readGitObject(headSpec)
      : readGitObject(indexSpec, readGitObject(headSpec));
  const modified = status === 'deleted'
    ? ''
    : staged
      ? readGitObject(indexSpec, readWorkingTree())
      : readWorkingTree();

  res.json({ path: filePath, original, modified, staged, status });
});

app.get('/api/git/inline-diff', (req, res) => {
  const gitWorkspace = getGitWorkspace(req);
  if (!gitWorkspace) return res.status(400).json({ error: 'No workspace' });
  const gitDir = path.join(gitWorkspace, '.git');
  if (!fs.existsSync(gitDir)) return res.status(400).json({ error: 'Not a Git repository' });

  const filePath = String(req.query.path || '');
  const staged = req.query.staged === 'true';
  const status = String(req.query.status || 'modified');
  const fullPath = safeGitPath(gitWorkspace, filePath);
  if (!filePath || !fullPath) return res.status(400).json({ error: 'Invalid path' });

  if (status === 'untracked') {
    try {
      const content = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : '';
      const lineCount = content.length ? content.split('\n').length : 0;
      const hunk = lineCount > 0
        ? { oldStart: 0, oldLines: 0, newStart: 1, newLines: lineCount, type: 'added' }
        : null;
      return res.json({ path: filePath, staged, status, hunks: hunk ? [hunk] : [] });
    } catch {
      return res.json({ path: filePath, staged, status, hunks: [] });
    }
  }

  const args = staged
    ? ['diff', '--staged', '--no-color', '--unified=0', '--', filePath]
    : ['diff', '--no-color', '--unified=0', '--', filePath];

  runGit(args, gitWorkspace, (err, stdout, stderr) => {
    if (err && !stdout) return res.status(500).json({ error: stderr || err.message });

    const hunks = [];
    const lines = String(stdout || '').split('\n');
    for (const line of lines) {
      if (!line.startsWith('@@')) continue;
      const m = /@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(line);
      if (!m) continue;
      const oldStart = Number(m[1]);
      const oldLines = Number(m[2] || '1');
      const newStart = Number(m[3]);
      const newLines = Number(m[4] || '1');
      const type = oldLines === 0 ? 'added' : newLines === 0 ? 'deleted' : 'modified';
      hunks.push({ oldStart, oldLines, newStart, newLines, type });
    }

    res.json({ path: filePath, staged, status, hunks });
  });
});

app.get('/api/git/blame-line', (req, res) => {
  const gitWorkspace = getGitWorkspace(req);
  if (!gitWorkspace) return res.status(400).json({ error: 'No workspace' });
  const gitDir = path.join(gitWorkspace, '.git');
  if (!fs.existsSync(gitDir)) return res.status(400).json({ error: 'Not a Git repository' });

  const filePath = String(req.query.path || '');
  const line = Number(req.query.line || 1);
  const fullPath = safeGitPath(gitWorkspace, filePath);
  if (!filePath || !fullPath || !Number.isFinite(line) || line < 1) return res.status(400).json({ error: 'Invalid path or line' });

  if (!fs.existsSync(fullPath)) {
    return res.json({ path: filePath, line, blame: null });
  }

  let head = '';
  try {
    head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: gitWorkspace, encoding: 'utf8' }).trim();
  } catch {
    head = '';
  }

  const cacheKey = `${gitWorkspace}::${head || 'no-head'}::${filePath}::${line}`;
  const cached = gitBlameCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < 15_000) {
    return res.json({ path: filePath, line, blame: cached.data });
  }

  runGit(['blame', '--line-porcelain', '-L', `${line},${line}`, '--', filePath], gitWorkspace, (err, stdout, stderr) => {
    if (err) {
      const text = String(stderr || err.message || '').toLowerCase();
      if (text.includes('no such path') || text.includes('file') || text.includes('outside repository')) {
        return res.json({ path: filePath, line, blame: null });
      }
      return res.status(500).json({ error: stderr || err.message });
    }

    const lines = String(stdout || '').split('\n');
    const header = (lines[0] || '').trim();
    const headerParts = header.split(' ');
    const commit = headerParts[0] || '';
    const author = (lines.find(l => l.startsWith('author ')) || '').slice(7).trim();
    const authorTimeRaw = (lines.find(l => l.startsWith('author-time ')) || '').slice(12).trim();
    const summary = (lines.find(l => l.startsWith('summary ')) || '').slice(8).trim();

    const authorTime = Number(authorTimeRaw || '0');
    const isUncommitted = /^0+$/.test(commit);
    const data = isUncommitted
      ? null
      : {
          commit,
          shortCommit: commit.slice(0, 8),
          author: author || 'Unknown',
          authorTime: Number.isFinite(authorTime) ? authorTime : 0,
          summary: summary || '(no message)',
        };

    gitBlameCache.set(cacheKey, { ts: Date.now(), data });
    res.json({ path: filePath, line, blame: data });
  });
});

app.post('/api/git/commit', (req, res) => {
  const gitWorkspace = getGitWorkspace(req);
  if (!gitWorkspace) return res.status(400).json({ error: 'No workspace' });
  const { message, amend = false } = req.body;
  if (!message || !message.trim()) return res.status(400).json({ error: 'Empty commit message' });
  const args = ['commit', ...(amend ? ['--amend'] : []), '-m', message.trim()];
  runGit(args, gitWorkspace, (err, stdout, stderr) => {
    if (err) return res.status(500).json({ error: stderr || err.message });
    res.json({ ok: true, output: stdout });
  });
});

app.post('/api/git/pull', (req, res) => {
  const gitWorkspace = getGitWorkspace(req);
  if (!gitWorkspace) return res.status(400).json({ error: 'No workspace' });

  const getCurrentBranch = () => {
    try {
      return execFileSync('git', ['branch', '--show-current'], { cwd: gitWorkspace, encoding: 'utf8' }).trim();
    } catch {
      return '';
    }
  };

  const branch = getCurrentBranch();

  runGit(['pull', '--ff-only'], gitWorkspace, (err, stdout, stderr) => {
    if (!err) return res.json({ ok: true, output: stdout });

    const errText = String(stderr || err.message || '');
    const noTracking = errText.includes('There is no tracking information for the current branch');

    if (!noTracking || !branch) {
      return res.status(500).json({ error: errText || 'git pull failed' });
    }

    runGit(['pull', '--ff-only', 'origin', branch], gitWorkspace, (err2, stdout2, stderr2) => {
      if (err2) return res.status(500).json({ error: stderr2 || err2.message });
      res.json({ ok: true, output: stdout2 });
    });
  });
});

app.post('/api/git/push', (req, res) => {
  const gitWorkspace = getGitWorkspace(req);
  if (!gitWorkspace) return res.status(400).json({ error: 'No workspace' });

  const getCurrentBranch = () => {
    try {
      return execFileSync('git', ['branch', '--show-current'], { cwd: gitWorkspace, encoding: 'utf8' }).trim();
    } catch {
      return '';
    }
  };

  const branch = getCurrentBranch();

  runGit(['push'], gitWorkspace, (err, stdout, stderr) => {
    if (!err) return res.json({ ok: true, output: stdout });

    const errText = String(stderr || err.message || '');
    const noUpstream = errText.includes('has no upstream branch');

    if (!noUpstream || !branch) {
      return res.status(500).json({ error: errText || 'git push failed' });
    }

    runGit(['push', '--set-upstream', 'origin', branch], gitWorkspace, (err2, stdout2, stderr2) => {
      if (err2) return res.status(500).json({ error: stderr2 || err2.message });
      res.json({ ok: true, output: stdout2 });
    });
  });
});

app.get('/api/files', (req, res) => {
  if (!workspace) return res.json({ files: [] });
  const files = [];
  const IGNORES = new Set(['node_modules', '.git', 'dist', 'build', '.next', '.cache', '.turbo', '.svelte-kit', 'coverage', 'out']);
  const walk = (dir, prefix) => {
    try {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (IGNORES.has(entry.name)) continue;
        const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          walk(path.join(dir, entry.name), rel);
        } else {
          files.push(rel);
        }
      }
    } catch {}
  };
  walk(workspace, '');
  res.json({ files });
});

app.post('/api/search', (req, res) => {
  try {
    const roots = workspaceRoots.getRoots();
    const results = roots.map(root => {
      const result = searchWorkspace(root.path, req.body || {});
      return {
        ...result,
        results: result.results.map(file => ({
          ...file,
          path: roots.length === 1 ? file.path : workspaceRoots.virtualPath(root.id, file.path),
        })),
      };
    });
    const result = {
      results: results.flatMap(item => item.results),
      totalMatches: results.reduce((sum, item) => sum + item.totalMatches, 0),
      truncated: results.some(item => item.truncated),
      engine: results.map(item => item.engine).find(Boolean),
    };
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err?.message || 'Search failed' });
  }
});

app.post('/api/search/replace', (req, res) => {
  try {
    const result = replaceWorkspace(workspace, req.body || {});
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err?.message || 'Replace failed' });
  }
});

app.get('/api/file', (req, res) => {
  try {
    const target = workspaceRoots.resolve(req.query.path);
    res.json(readWorkspaceFile(target.root, target.path));
  } catch (error) {
    if (error.message === 'NOT_FOUND') return res.status(404).json({ error: 'File not found' });
    if (error.message === 'INVALID_PATH') return res.status(400).json({ error: 'Invalid path' });
    if (error.message === 'FILE_TOO_LARGE') return res.status(413).json({ error: 'File is too large to open as editable text', size: error.size });
    res.status(500).json({ error: 'Cannot read file' });
  }
});

app.get('/api/raw', (req, res) => {
  const rawPath = req.query.path;
  const p = safePath(rawPath);
  if (!p || !fs.existsSync(p)) return res.status(404).send('Not found');
  try {
    const ext = path.extname(p).toLowerCase().slice(1);
    const mimeMap = {
      png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
      svg: 'image/svg+xml', webp: 'image/webp', bmp: 'image/bmp', ico: 'image/x-icon',
      mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg',
      mp4: 'video/mp4', webm: 'video/webm',
      pdf: 'application/pdf',
    };
    res.setHeader('Content-Type', mimeMap[ext] || 'application/octet-stream');
    fs.createReadStream(p).pipe(res);
  } catch { res.status(500).send('Cannot read file'); }
});

app.put('/api/file', (req, res) => {
  const { filePath, content } = req.body;
  try {
    const target = workspaceRoots.resolve(filePath);
    writeWorkspaceFile(target.root, target.path, content);
    res.json({ ok: true });
  } catch (error) {
    if (error.message === 'INVALID_PATH') return res.status(400).json({ error: 'Invalid path' });
    res.status(500).json({ error: 'Cannot write file' });
  }
});

app.post('/api/create', (req, res) => {
  const { filePath, type } = req.body;
  try {
    const target = workspaceRoots.resolve(filePath);
    createWorkspaceEntry(target.root, target.path, type);
    res.json({ ok: true });
  } catch (error) {
    if (error.message === 'INVALID_PATH' || error.message === 'INVALID_TYPE') return res.status(400).json({ error: 'Invalid path or type' });
    if (error.message === 'ALREADY_EXISTS') return res.status(409).json({ error: 'Already exists' });
    res.status(500).json({ error: 'Cannot create' });
  }
});

app.delete('/api/delete', (req, res) => {
  try {
    const target = workspaceRoots.resolve(req.query.path);
    deleteWorkspaceEntry(target.root, target.path);
    deleteRecoveryBuffer(target.root, target.path);
    res.json({ ok: true });
  } catch (error) {
    if (error.message === 'NOT_FOUND') return res.status(404).json({ error: 'Not found' });
    if (error.message === 'INVALID_PATH') return res.status(400).json({ error: 'Invalid path' });
    res.status(500).json({ error: 'Cannot delete' });
  }
});

app.post('/api/rename', (req, res) => {
  const { oldPath, newName } = req.body;
  try {
    const target = workspaceRoots.resolve(oldPath);
    const result = renameWorkspaceEntry(target.root, target.path, newName);
    res.json({ ok: true, ...result, path: workspaceRoots.getRoots().length === 1 ? result.path : workspaceRoots.virtualPath(target.rootId, result.path) });
  } catch (error) {
    if (error.message === 'NOT_FOUND') return res.status(404).json({ error: 'Not found' });
    if (error.message === 'INVALID_PATH' || error.message === 'INVALID_NAME') return res.status(400).json({ error: 'Invalid name' });
    if (error.message === 'ALREADY_EXISTS') return res.status(409).json({ error: 'Already exists' });
    res.status(500).json({ error: 'Cannot rename' });
  }
});

app.post('/api/run', (req, res) => {
  const { filePath } = req.body;
  const p = safePath(filePath);
  if (!p || !fs.existsSync(p)) return res.status(404).json({ error: 'File not found' });

  const ext = path.extname(p);
  let cmd, args;
  if (ext === '.py') { cmd = 'python'; args = [p]; }
  else if (ext === '.sh' || ext === '.bash') { cmd = 'bash'; args = [p]; }
  else { cmd = 'node'; args = [p]; }

  execFile(cmd, args, { timeout: 10000, cwd: path.dirname(p), maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
    res.json({
      output: stdout || '',
      error: stderr || '',
      exitCode: err ? (err.code || 1) : 0,
      timedOut: err && err.killed,
    });
  });
});

app.post('/api/move', (req, res) => {
  const { sourcePath, targetPath, position } = req.body;
  try {
    const source = workspaceRoots.resolve(sourcePath);
    const target = workspaceRoots.resolve(targetPath);
    if (source.root !== target.root) throw new Error('INVALID_TARGET');
    const result = moveWorkspaceEntry(source.root, source.path, target.path, position);
    res.json({ ok: true, ...result, path: workspaceRoots.getRoots().length === 1 ? result.path : workspaceRoots.virtualPath(source.rootId, result.path) });
  } catch (error) {
    if (error.message === 'NOT_FOUND') return res.status(404).json({ error: 'Source not found' });
    if (error.message === 'INVALID_PATH' || error.message === 'INVALID_TARGET') return res.status(400).json({ error: 'Invalid target' });
    if (error.message === 'ALREADY_EXISTS') return res.status(409).json({ error: 'Destination exists' });
    res.status(500).json({ error: 'Cannot move' });
  }
});

// ---- Settings JSON endpoints ----

app.get('/api/settings', (req, res) => {
  const requestedRoot = req.query.root ? workspaceRoots.resolve(req.query.root).root : workspace;
  res.json({
    defaults: defaultSettings,
    global: loadGlobalSettings(),
    workspace: loadWorkspaceSettings(requestedRoot),
    merged: loadMergedSettings(requestedRoot),
    globalPath: getGlobalSettingsPath(),
    workspacePath: getWorkspaceSettingsPath(requestedRoot),
  });
});

app.put('/api/settings', (req, res) => {
  const { scope } = req.query;
  if (scope === 'workspace') {
    saveWorkspaceSettingsFile(workspace, req.body);
  } else {
    saveGlobalSettings(req.body);
  }
  res.json({ ok: true });
});

app.get('/api/settings/raw', (req, res) => {
  const { scope } = req.query;
  if (scope === 'workspace') {
    res.json({
      content: loadWorkspaceSettingsRaw(workspace),
      path: getWorkspaceSettingsPath(workspace),
    });
  } else {
    res.json({
      content: loadGlobalSettingsRaw(),
      path: getGlobalSettingsPath(),
    });
  }
});

app.put('/api/settings/raw', (req, res) => {
  const { scope } = req.query;
  const { content } = req.body;
  try {
    JSON.parse(content);
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  if (scope === 'workspace') {
    saveWorkspaceSettingsRaw(workspace, content);
  } else {
    saveGlobalSettingsRaw(content);
  }
  res.json({ ok: true });
});

app.get('/api/settings/schema', (_req, res) => {
  res.json(defaultSettings);
});

// ---- State endpoints ----

app.get('/api/state', (req, res) => {
  res.json(loadState());
});

app.put('/api/state', (req, res) => {
  saveState(req.body);
  res.json({ ok: true });
});

app.post('/api/search/stream', (req, res) => {
  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  try {
    const roots = workspaceRoots.getRoots();
    let totalMatches = 0;
    let truncated = false;
    let engine;
    for (const root of roots) {
      const result = searchWorkspace(root.path, req.body || {});
      totalMatches += result.totalMatches;
      truncated ||= result.truncated;
      engine ||= result.engine;
      for (const file of result.results) {
        const streamedFile = {
          ...file,
          path: roots.length === 1 ? file.path : workspaceRoots.virtualPath(root.id, file.path),
        };
        res.write(`${JSON.stringify({ type: 'file', file: streamedFile })}\n`);
      }
    }
    res.end(`${JSON.stringify({
      type: 'complete',
      totalMatches,
      truncated,
      engine,
    })}\n`);
  } catch (err) {
    res.status(400).end(`${JSON.stringify({ type: 'error', error: err?.message || 'Search failed' })}\n`);
  }
});

app.get('/api/file-preview', (req, res) => {
  const p = safePath(req.query.path);
  if (!p || !fs.existsSync(p)) return res.status(404).json({ error: 'File not found' });
  try {
    const stat = fs.statSync(p);
    const offset = Math.max(0, Number(req.query.offset) || 0);
    const limit = Math.min(256 * 1024, Math.max(4096, Number(req.query.limit) || 128 * 1024));
    const length = Math.max(0, Math.min(limit, stat.size - offset));
    const buffer = Buffer.alloc(length);
    const fd = fs.openSync(p, 'r');
    const bytesRead = fs.readSync(fd, buffer, 0, length, offset);
    fs.closeSync(fd);
    const chunk = buffer.subarray(0, bytesRead);
    const isBinary = chunk.some(byte => byte < 8 && byte !== 0x09 && byte !== 0x0A && byte !== 0x0D);
    if (isBinary) return res.status(415).json({ error: 'Binary files cannot be previewed as text' });
    const nextOffset = offset + bytesRead;
    res.json({
      content: chunk.toString('utf8'),
      offset: nextOffset,
      size: stat.size,
      done: nextOffset >= stat.size,
    });
  } catch {
    res.status(500).json({ error: 'Cannot read file preview' });
  }
});

app.post('/api/git/resolve-conflict', (req, res) => {
  const gitWorkspace = getGitWorkspace(req);
  if (!gitWorkspace) return res.status(400).json({ error: 'No workspace' });
  const filePath = String(req.body?.path || '');
  const strategy = String(req.body?.strategy || 'resolved');
  if (!filePath || !safeGitPath(gitWorkspace, filePath)) return res.status(400).json({ error: 'Invalid path' });
  const finish = () => runGit(['add', '--', filePath], gitWorkspace, (addError, stdout, stderr) => {
    if (addError) return res.status(500).json({ error: stderr || addError.message });
    res.json({ ok: true, output: stdout });
  });
  if (strategy === 'ours' || strategy === 'theirs') {
    runGit(['checkout', `--${strategy}`, '--', filePath], gitWorkspace, (error, stdout, stderr) => {
      if (error) return res.status(500).json({ error: stderr || error.message });
      finish();
    });
    return;
  }
  finish();
});

app.post('/api/search/replace-match', (req, res) => {
  try {
    res.json(replaceWorkspaceMatch(workspace, req.body || {}));
  } catch (err) {
    res.status(409).json({ error: err?.message || 'Single replacement failed' });
  }
});

app.get('/api/file-cursor', (req, res) => {
  const filePath = String(req.query.path || '');
  const p = safePath(filePath);
  if (!p) return res.status(400).json({ error: 'Invalid path' });
  res.json(loadFileCursorPosition(filePath) || {});
});

app.put('/api/file-cursor', (req, res) => {
  const { filePath, line, column, viewState } = req.body || {};
  const p = safePath(filePath);
  if (!p) return res.status(400).json({ error: 'Invalid path' });
  saveFileCursorPosition(filePath, Number(line), Number(column), viewState || null);
  res.json({ ok: true });
});

app.get('/api/recovery', (_req, res) => {
  res.json({ buffers: loadRecoveryBuffers(workspace) });
});

app.put('/api/recovery', (req, res) => {
  const { filePath, content } = req.body || {};
  const p = safePath(filePath);
  if (!p || typeof content !== 'string') return res.status(400).json({ error: 'Invalid recovery buffer' });
  saveRecoveryBuffer(workspace, filePath, content);
  res.json({ ok: true });
});

app.delete('/api/recovery', (req, res) => {
  const filePath = String(req.query.path || '');
  const p = safePath(filePath);
  if (!p) return res.status(400).json({ error: 'Invalid path' });
  deleteRecoveryBuffer(workspace, filePath);
  res.json({ ok: true });
});

app.delete('/api/recovery/all', (_req, res) => {
  deleteRecoveryBuffers(workspace);
  res.json({ ok: true });
});

app.post('/api/close-workspace', (req, res) => {
  workspace = path.join(__dirname, '..', 'workspace');
  if (!fs.existsSync(workspace)) fs.mkdirSync(workspace, { recursive: true });
  saveWorkspacePath('');
  stopFsWatcher();
  res.json({ ok: true });
});

const server = createServer(app);

// ---- WebSocket routing (terminal + fs watcher) ----

const wss = new WebSocketServer({ noServer: true });
const fsWss = new WebSocketServer({ noServer: true });
const lspWss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  if (request.url === '/ws/terminal') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else if (request.url === '/ws/fs') {
    fsWss.handleUpgrade(request, socket, head, (ws) => {
      fsWss.emit('connection', ws, request);
    });
  } else if (request.url && request.url.startsWith('/ws/lsp/')) {
    const parsed = parseLspUrl(request.url);
    if (!parsed) { socket.destroy(); return; }
    lspWss.handleUpgrade(request, socket, head, (ws) => {
      attachLspBridge(ws, parsed.lang, workspace);
    });
  } else {
    socket.destroy();
  }
});

lspWss.on('error', (error) => {
  if (error?.code === 'EADDRINUSE') return;
  console.error('LSP WebSocket error:', error);
});

wss.on('error', (error) => {
  if (error?.code === 'EADDRINUSE') {
    console.warn(`BlinkCode terminal WebSocket is already bound on port ${process.env.PORT || 3001}`);
    return;
  }

  console.error('Terminal WebSocket error:', error);
});

fsWss.on('error', (error) => {
  if (error?.code === 'EADDRINUSE') return;
  console.error('FS watcher WebSocket error:', error);
});

// ---- File system watcher ----

const IGNORED_DIR_NAMES = new Set([
  'node_modules', 'dist', 'build', 'coverage',
  '.git', '.cache', '.next', '.nuxt', '.svelte-kit',
  '.turbo', '.output', '.parcel-cache', '.vite', '.idea',
]);

function shouldIgnoreFsPath(absPath) {
  if (!absPath) return false;
  const name = path.basename(absPath);
  if (IGNORED_DIR_NAMES.has(name)) return true;
  if (
    name.startsWith('.') &&
    name !== '.gitignore' &&
    name !== '.gitmodules' &&
    name !== '.dockerignore' &&
    !name.startsWith('.env')
  ) return true;
  return false;
}

function broadcastFsEvent(payload) {
  const msg = JSON.stringify(payload);
  for (const client of fsWss.clients) {
    if (client.readyState === 1) {
      try { client.send(msg); } catch {}
    }
  }
}

let fsWatcher = null;
let fsWatcherRoot = null;

function stopFsWatcher() {
  if (!fsWatcher) return;
  try { fsWatcher.close(); } catch {}
  fsWatcher = null;
  fsWatcherRoot = null;
}

function startFsWatcher() {
  stopFsWatcher();
  const roots = workspaceRoots.getRoots();
  const watchedPaths = roots.map(item => item.path);
  fsWatcherRoot = watchedPaths.join(path.delimiter);

  fsWatcher = chokidar.watch(watchedPaths, {
    ignored: (p) => !watchedPaths.includes(path.resolve(p)) && shouldIgnoreFsPath(p),
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 40, pollInterval: 15 },
    depth: 20,
    followSymlinks: false,
    ignorePermissionErrors: true,
  });

  const relOf = (abs) => {
    const owner = roots.find(item => {
      const relative = path.relative(item.path, abs);
      return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
    });
    if (!owner) return '';
    const rel = path.relative(owner.path, abs).replace(/\\/g, '/');
    return roots.length === 1 ? rel : workspaceRoots.virtualPath(owner.id, rel);
  };

  const emit = (type, abs, isDir) => {
    const rel = relOf(abs);
    if (!rel || rel.startsWith('..')) return;
    broadcastFsEvent({
      type,
      path: rel,
      name: path.basename(abs),
      isDir,
    });
  };

  fsWatcher.on('add', (p) => emit('add', p, false));
  fsWatcher.on('addDir', (p) => {
    if (watchedPaths.includes(path.resolve(p))) return;
    emit('addDir', p, true);
  });
  fsWatcher.on('unlink', (p) => emit('unlink', p, false));
  fsWatcher.on('unlinkDir', (p) => emit('unlinkDir', p, true));
  fsWatcher.on('change', (p) => emit('change', p, false));
  fsWatcher.on('error', (err) => console.warn('[fs watcher]', err?.message || err));
}

fsWss.on('connection', (ws) => {
  try {
    ws.send(JSON.stringify({ type: 'hello', workspace: path.basename(workspace) }));
  } catch {}
});

const ptyManager = createPtyManager({ getDefaultCwd: () => workspace });

function getShellCwd(shellId) {
  const s = ptyManager.get(shellId);
  return s ? s.cwd : workspace;
}

function resolveShellCwd(requestedCwd) {
  if (!requestedCwd || typeof requestedCwd !== 'string') return workspace;
  const normalized = path.resolve(requestedCwd);
  try {
    const stat = fs.statSync(normalized);
    if (stat.isDirectory()) return normalized;
  } catch {}
  return workspace;
}

wss.on('connection', (ws) => {
  const shellId = Math.random().toString(36).slice(2);
  let disconnect = null;

  ws.on('message', (data) => {
    let msg;
    try { msg = JSON.parse(data.toString()); } catch { return; }

    if (msg.type === 'start') {
      ptyManager.create({
        id: shellId,
        cwd: resolveShellCwd(msg.cwd),
        cols: Number(msg.cols || 120),
        rows: Number(msg.rows || 30),
        command: typeof msg.command === 'string' ? msg.command.slice(0, 10_000) : undefined,
      });
      disconnect = ptyManager.connect(shellId, ws, msg.cursor);
    }

    if (msg.type === 'input') {
      ptyManager.write(shellId, ptyManager.decodeIncoming(msg.data));
    }

    if (msg.type === 'cwd') {
      const cwd = getShellCwd(shellId);
      ws.send(JSON.stringify({ type: 'ready', cwd }));
    }

    if (msg.type === 'resize') {
      ptyManager.resize(shellId, Number(msg.cols || 120), Number(msg.rows || 30));
    }

    if (msg.type === 'kill') {
      ptyManager.close(shellId);
    }

    if (msg.type === 'restart') {
      ptyManager.close(shellId);
      ptyManager.create({
        id: shellId,
        cwd: resolveShellCwd(msg.cwd),
        cols: Number(msg.cols || 120),
        rows: Number(msg.rows || 30),
        command: typeof msg.command === 'string' ? msg.command.slice(0, 10_000) : undefined,
      });
      disconnect = ptyManager.connect(shellId, ws, msg.cursor);
    }
  });

  ws.on('close', () => {
    disconnect?.();
    ptyManager.close(shellId);
  });
});

app.use('/api/{*splat}', (_req, res) => {
  res.status(404).json({
    error: 'API endpoint not found. Restart BlinkCode if the application was updated while it was running.',
  });
});

app.use(express.static(path.join(__dirname, '..', 'dist')));
app.get('/{*splat}', (req, res) => {
  const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  }
});

let startedServer = null;

export function startBlinkCodeServer(port = process.env.PORT || 3001) {
  if (startedServer) return startedServer;

  startedServer = new Promise((resolve, reject) => {
    const onError = (error) => {
      server.off('error', onError);

      if (error?.code === 'EADDRINUSE') {
        reject(new Error(`Port ${port} is already in use`));
        return;
      }

      reject(error);
    };

    server.once('error', onError);
    server.listen(port, () => {
      server.off('error', onError);
      console.log(`BlinkCode server running on http://localhost:${port}`);
      startFsWatcher();
      resolve(server);
    });
  });

  return startedServer;
}

export async function stopBlinkCodeServer() {
  stopFsWatcher();
  for (const webSocketServer of [wss, fsWss, lspWss]) {
    for (const client of webSocketServer.clients) client.terminate();
  }
  if (!server.listening) {
    startedServer = null;
    return;
  }
  await new Promise((resolve) => server.close(resolve));
  startedServer = null;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  startBlinkCodeServer().catch(() => {});
}
