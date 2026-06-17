import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import { runMigrations } from './migrations/runMigrations.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isPackaged = __dirname.includes('app.asar');
const userDataDir = path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'BlinkCode');
const storageDir = process.env.BLINKCODE_STORAGE_DIR
  ? path.resolve(process.env.BLINKCODE_STORAGE_DIR)
  : (isPackaged ? userDataDir : __dirname);
const DB_PATH = path.join(storageDir, 'blinkcode.db');
const FALLBACK_PATH = path.join(storageDir, 'blinkcode-store.json');
const MIGRATION_BACKUP_PATH = path.join(storageDir, 'blinkcode.pre-migration.bak');
const LEGACY_STATE_PATH = path.join(storageDir, 'blinkcode-state.json');

fs.mkdirSync(storageDir, { recursive: true });

if (fs.existsSync(DB_PATH)) {
  fs.copyFileSync(DB_PATH, MIGRATION_BACKUP_PATH);
}

let db = null;
let fallbackStore = null;

function createFallbackStore() {
  return {
    editorState: null,
    settings: {},
    recentProjects: [],
    fileCursorPositions: {},
    httpRequestHistory: [],
    recoveryBuffers: {},
  };
}

function loadFallbackStore() {
  if (fallbackStore) return fallbackStore;
  try {
    fallbackStore = { ...createFallbackStore(), ...JSON.parse(fs.readFileSync(FALLBACK_PATH, 'utf8')) };
  } catch {
    fallbackStore = createFallbackStore();
  }
  return fallbackStore;
}

function saveFallbackStore() {
  if (!fallbackStore) return;
  const tmpPath = `${FALLBACK_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(fallbackStore, null, 2));
  fs.renameSync(tmpPath, FALLBACK_PATH);
}

try {
  db = new Database(DB_PATH);
} catch (error) {
  const reason = String(error?.message || error).split('\n')[0];
  console.warn(`SQLite storage is unavailable, using JSON fallback: ${reason}`);
  db = null;
  loadFallbackStore();
}

if (db) {
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');

  db.exec(`
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS editor_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS recent_projects (
  path TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  opened_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS search_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS command_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  command TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS file_cursor_positions (
  path TEXT PRIMARY KEY,
  line INTEGER NOT NULL,
  column INTEGER NOT NULL,
  view_state TEXT,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS http_request_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  method TEXT NOT NULL,
  url TEXT NOT NULL,
  status INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS recovery_buffers (
  workspace_path TEXT NOT NULL,
  file_path TEXT NOT NULL,
  content TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (workspace_path, file_path)
);
`);

  try {
    runMigrations(db);
    if (fs.existsSync(MIGRATION_BACKUP_PATH)) fs.rmSync(MIGRATION_BACKUP_PATH, { force: true });
  } catch (error) {
    try { db.close(); } catch {}
    if (fs.existsSync(MIGRATION_BACKUP_PATH)) {
      fs.copyFileSync(MIGRATION_BACKUP_PATH, DB_PATH);
    }
    throw error;
  }
}

function getSetting(key, fallback = '') {
  if (!db) return loadFallbackStore().settings[key]?.value ?? fallback;
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : fallback;
}

function setSetting(key, value) {
  if (!db) {
    const store = loadFallbackStore();
    store.settings[key] = { value, updatedAt: Date.now() };
    saveFallbackStore();
    return;
  }
  db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = excluded.updated_at
  `).run(key, value, Date.now());
}

function migrateFromLegacyJsonIfNeeded() {
  if (!db) {
    const store = loadFallbackStore();
    const hasState = Boolean(store.editorState);
    const hasWorkspace = Boolean(store.settings.workspacePath?.value);
    const hasRecent = store.recentProjects.length > 0;
    if (hasState || hasWorkspace || hasRecent || !fs.existsSync(LEGACY_STATE_PATH)) return;
    try {
      const parsed = JSON.parse(fs.readFileSync(LEGACY_STATE_PATH, 'utf-8'));
      store.editorState = { data: parsed?.editorState ?? {}, updatedAt: Date.now() };
      if (parsed?.workspacePath) store.settings.workspacePath = { value: parsed.workspacePath, updatedAt: Date.now() };
      store.recentProjects = Array.isArray(parsed?.recentProjects)
        ? parsed.recentProjects.slice(0, 5).filter(project => project?.path).map((project, index) => ({
          path: project.path,
          name: project.name || path.basename(project.path) || project.path,
          openedAt: Date.now() - index,
        }))
        : [];
      saveFallbackStore();
    } catch {}
    return;
  }

  const row = db.prepare('SELECT data FROM editor_state WHERE id = 1').get();
  const hasState = Boolean(row);
  const hasWorkspace = Boolean(getSetting('workspacePath', ''));
  const hasRecent = db.prepare('SELECT COUNT(*) AS count FROM recent_projects').get().count > 0;

  if (hasState || hasWorkspace || hasRecent) return;
  if (!fs.existsSync(LEGACY_STATE_PATH)) return;

  try {
    const parsed = JSON.parse(fs.readFileSync(LEGACY_STATE_PATH, 'utf-8'));
    const editorState = parsed?.editorState ?? {};
    const workspacePath = parsed?.workspacePath ?? '';
    const recentProjects = Array.isArray(parsed?.recentProjects) ? parsed.recentProjects : [];

    const tx = db.transaction(() => {
      db.prepare('INSERT OR REPLACE INTO editor_state (id, data, updated_at) VALUES (1, ?, ?)')
        .run(JSON.stringify(editorState), Date.now());

      if (workspacePath) {
        setSetting('workspacePath', workspacePath);
      }

      const insertRecent = db.prepare(`
        INSERT INTO recent_projects (path, name, opened_at)
        VALUES (?, ?, ?)
        ON CONFLICT(path) DO UPDATE SET
          name = excluded.name,
          opened_at = excluded.opened_at
      `);

      recentProjects.slice(0, 5).forEach((project, index) => {
        if (!project?.path) return;
        insertRecent.run(
          project.path,
          project.name || path.basename(project.path) || project.path,
          Date.now() - index,
        );
      });
    });

    tx();
  } catch {
    // ignore malformed legacy state
  }
}

migrateFromLegacyJsonIfNeeded();

export function saveState(data) {
  if (!db) {
    const store = loadFallbackStore();
    store.editorState = { data: data ?? {}, updatedAt: Date.now() };
    saveFallbackStore();
    return;
  }
  db.prepare('INSERT OR REPLACE INTO editor_state (id, data, updated_at) VALUES (1, ?, ?)')
    .run(JSON.stringify(data ?? {}), Date.now());
}

export function loadState() {
  try {
    if (!db) return loadFallbackStore().editorState?.data ?? {};
    const row = db.prepare('SELECT data FROM editor_state WHERE id = 1').get();
    if (!row?.data) return {};
    return JSON.parse(row.data);
  } catch {
    return {};
  }
}

export function saveWorkspacePath(p) {
  setSetting('workspacePath', p || '');
}

export function loadWorkspacePath() {
  return getSetting('workspacePath', '');
}

export function addRecentProject(projectPath, name) {
  if (!projectPath) return;

  const now = Date.now();
  if (!db) {
    const store = loadFallbackStore();
    const next = store.recentProjects.filter(project => project.path !== projectPath);
    next.unshift({ path: projectPath, name: name || path.basename(projectPath) || projectPath, openedAt: now });
    store.recentProjects = next.slice(0, 5);
    saveFallbackStore();
    return;
  }

  db.prepare(`
    INSERT INTO recent_projects (path, name, opened_at)
    VALUES (?, ?, ?)
    ON CONFLICT(path) DO UPDATE SET
      name = excluded.name,
      opened_at = excluded.opened_at
  `).run(projectPath, name || path.basename(projectPath) || projectPath, now);

  db.prepare(`
    DELETE FROM recent_projects
    WHERE path NOT IN (
      SELECT path FROM recent_projects
      ORDER BY opened_at DESC
      LIMIT 5
    )
  `).run();
}

export function loadRecentProjects() {
  if (!db) {
    return loadFallbackStore().recentProjects
      .slice()
      .sort((left, right) => right.openedAt - left.openedAt)
      .slice(0, 5)
      .map(project => ({ path: project.path, name: project.name }));
  }
  return db.prepare(`
    SELECT path, name
    FROM recent_projects
    ORDER BY opened_at DESC
    LIMIT 5
  `).all();
}

export function saveFileCursorPosition(filePath, line, column, viewState = null) {
  if (!filePath || !Number.isSafeInteger(line) || !Number.isSafeInteger(column)) return;
  const serializedViewState = viewState ? JSON.stringify(viewState) : null;
  if (!db) {
    const store = loadFallbackStore();
    store.fileCursorPositions[filePath] = {
      line: Math.max(1, line),
      column: Math.max(1, column),
      viewState: serializedViewState,
      updatedAt: Date.now(),
    };
    saveFallbackStore();
    return;
  }

  db.prepare(`
    INSERT INTO file_cursor_positions (path, line, column, view_state, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(path) DO UPDATE SET
      line = excluded.line,
      column = excluded.column,
      view_state = excluded.view_state,
      updated_at = excluded.updated_at
  `).run(filePath, Math.max(1, line), Math.max(1, column), serializedViewState, Date.now());
}

export function loadFileCursorPosition(filePath) {
  if (!filePath) return null;
  if (!db) {
    const row = loadFallbackStore().fileCursorPositions[filePath];
    if (!row) return null;
    let viewState = null;
    try {
      viewState = row.viewState ? JSON.parse(row.viewState) : null;
    } catch {}
    return {
      line: Math.max(1, Number(row.line) || 1),
      column: Math.max(1, Number(row.column) || 1),
      viewState,
    };
  }
  const row = db.prepare('SELECT line, column, view_state FROM file_cursor_positions WHERE path = ?').get(filePath);
  if (!row) return null;
  let viewState = null;
  try {
    viewState = row.view_state ? JSON.parse(row.view_state) : null;
  } catch {}

  return {
    line: Math.max(1, Number(row.line) || 1),
    column: Math.max(1, Number(row.column) || 1),
    viewState,
  };
}

export function saveRecoveryBuffer(workspacePath, filePath, content) {
  if (!workspacePath || !filePath || typeof content !== 'string') return;
  if (!db) {
    const store = loadFallbackStore();
    store.recoveryBuffers[`${workspacePath}\n${filePath}`] = { workspacePath, filePath, content, updatedAt: Date.now() };
    saveFallbackStore();
    return;
  }
  db.prepare(`
    INSERT INTO recovery_buffers (workspace_path, file_path, content, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(workspace_path, file_path) DO UPDATE SET
      content = excluded.content,
      updated_at = excluded.updated_at
  `).run(workspacePath, filePath, content, Date.now());
}

export function loadRecoveryBuffers(workspacePath) {
  if (!workspacePath) return [];
  if (!db) {
    return Object.values(loadFallbackStore().recoveryBuffers)
      .filter(item => item.workspacePath === workspacePath)
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .map(item => ({ filePath: item.filePath, content: item.content, updatedAt: item.updatedAt }));
  }
  return db.prepare(`
    SELECT file_path AS filePath, content, updated_at AS updatedAt
    FROM recovery_buffers
    WHERE workspace_path = ?
    ORDER BY updated_at DESC
  `).all(workspacePath);
}

export function deleteRecoveryBuffer(workspacePath, filePath) {
  if (!workspacePath || !filePath) return;
  if (!db) {
    const store = loadFallbackStore();
    delete store.recoveryBuffers[`${workspacePath}\n${filePath}`];
    saveFallbackStore();
    return;
  }
  db.prepare('DELETE FROM recovery_buffers WHERE workspace_path = ? AND file_path = ?')
    .run(workspacePath, filePath);
}

export function deleteRecoveryBuffers(workspacePath) {
  if (!workspacePath) return;
  if (!db) {
    const store = loadFallbackStore();
    for (const [key, item] of Object.entries(store.recoveryBuffers)) {
      if (item.workspacePath === workspacePath) delete store.recoveryBuffers[key];
    }
    saveFallbackStore();
    return;
  }
  db.prepare('DELETE FROM recovery_buffers WHERE workspace_path = ?').run(workspacePath);
}

export function saveHttpRequestHistory(request, response) {
  if (!db) {
    const store = loadFallbackStore();
    const nextId = Math.max(0, ...store.httpRequestHistory.map(item => item.id || 0)) + 1;
    const entry = {
      id: nextId,
      method: request.method,
      url: request.url,
      status: response.status,
      durationMs: response.durationMs,
      createdAt: Date.now(),
    };
    store.httpRequestHistory.unshift(entry);
    store.httpRequestHistory = store.httpRequestHistory.slice(0, 100);
    saveFallbackStore();
    return { id: entry.id, method: entry.method, url: entry.url, status: entry.status };
  }
  const result = db.prepare(`
    INSERT INTO http_request_history (method, url, status, duration_ms, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(request.method, request.url, response.status, response.durationMs, Date.now());
  db.prepare(`
    DELETE FROM http_request_history
    WHERE id NOT IN (SELECT id FROM http_request_history ORDER BY created_at DESC LIMIT 100)
  `).run();
  return { id: Number(result.lastInsertRowid), method: request.method, url: request.url, status: response.status };
}

export function loadHttpRequestHistory() {
  if (!db) {
    return loadFallbackStore().httpRequestHistory
      .slice()
      .sort((left, right) => right.createdAt - left.createdAt)
      .slice(0, 100);
  }
  return db.prepare(`
    SELECT id, method, url, status, duration_ms AS durationMs, created_at AS createdAt
    FROM http_request_history
    ORDER BY created_at DESC
    LIMIT 100
  `).all();
}
