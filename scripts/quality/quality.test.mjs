import assert from 'node:assert/strict';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import Database from 'better-sqlite3';
import { resolveWorkspacePath } from '../../server/pathSafety.js';
import { LARGE_TEXT_FILE_LIMIT } from '../../server/fileLimits.js';
import {
  CURRENT_SCHEMA_VERSION,
  runMigrations,
} from '../../server/migrations/runMigrations.js';
import { findNpmScripts } from '../../server/npmScripts.js';

const root = process.cwd();

function readSource(relativePath) {
  return readFileSync(resolve(root, relativePath), 'utf8');
}

function parseStringSetExport(source) {
  return new Set([...source.matchAll(/'([^']+)'/g)].map((match) => match[1]));
}

test('English and Russian dictionaries have matching unique keys', () => {
  const readKeys = (language) => {
    const source = readSource(`src/features/i18n/${language}.ts`);
    const keys = [...source.matchAll(/^\s*'([^']+)':/gm)].map(
      (match) => match[1],
    );
    assert.equal(
      new Set(keys).size,
      keys.length,
      `${language} dictionary contains duplicate keys`,
    );
    return new Set(keys);
  };
  assert.deepEqual(readKeys('ru'), readKeys('en'));
});

test('visible UI strings use the localization dictionaries', () => {
  const result = spawnSync(
    process.execPath,
    ['scripts/quality/find-unlocalized-ui.mjs', '--check'],
    { cwd: root, encoding: 'utf8' },
  );
  assert.equal(result.status, 0, result.stdout || result.stderr);
});

test('resolveWorkspacePath keeps relative paths inside the workspace', () => {
  const workspace = resolve(root, 'tmp-quality-workspace');

  assert.equal(
    resolveWorkspacePath(workspace, 'src/index.ts'),
    resolve(workspace, 'src/index.ts'),
  );
  assert.equal(resolveWorkspacePath(workspace, '.'), workspace);
});

test('resolveWorkspacePath rejects traversal and sibling-prefix escapes', () => {
  const workspace = resolve(root, 'tmp-quality-workspace');
  const sibling = `${workspace}-evil/file.txt`;

  assert.equal(resolveWorkspacePath(workspace, '../outside.txt'), null);
  assert.equal(resolveWorkspacePath(workspace, sibling), null);
  assert.equal(
    resolveWorkspacePath(workspace, resolve(root, 'outside.txt')),
    null,
  );
});

test('resolveWorkspacePath rejects encoded traversal attempts', () => {
  const workspace = resolve(root, 'tmp-quality-workspace');
  mkdirSync(workspace, { recursive: true });
  try {
    assert.equal(resolveWorkspacePath(workspace, '%2e%2e/outside.txt'), null);
    assert.equal(
      resolveWorkspacePath(workspace, '%252e%252e%252foutside.txt'),
      null,
    );
    assert.equal(resolveWorkspacePath(workspace, '..%5coutside.txt'), null);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test('resolveWorkspacePath rejects symlinks escaping the workspace', (t) => {
  const workspace = mkdtempSync(resolve(tmpdir(), 'blinkcode-path-root-'));
  const outside = mkdtempSync(resolve(tmpdir(), 'blinkcode-path-outside-'));
  const link = resolve(workspace, 'outside-link');
  try {
    try {
      symlinkSync(outside, link, 'junction');
    } catch (error) {
      t.skip(`Symlink creation unavailable: ${error.message}`);
      return;
    }
    assert.equal(
      resolveWorkspacePath(workspace, 'outside-link/secret.txt'),
      null,
    );
  } finally {
    rmSync(workspace, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});

test('binary blocked extensions cover installer and packaged app artifacts', () => {
  const source = readSource(
    'src/features/fileSupport/binaryBlockedExtensions.ts',
  );
  const extensions = parseStringSetExport(source);

  for (const extension of [
    'blockmap',
    'pak',
    'dat',
    'data',
    'blob',
    'bundle',
    'asar',
    'msi',
    'node',
  ]) {
    assert.equal(
      extensions.has(extension),
      true,
      `${extension} should be blocked as binary`,
    );
  }
});

test('blocked binary files do not fetch editable text content', () => {
  const source = readSource('src/features/editorProvider/openFileForEditor.ts');

  assert.match(source, /isBinaryBlockedFile\(file\.name\)/);
  assert.match(
    source,
    /file\.type === 'file' && !file\.binary && !isBlockedBinary/,
  );
  assert.match(
    source,
    /file\.type === 'file' && \(file\.binary \|\| isBlockedBinary \|\| isLargeFile\)/,
  );
});

test('large files are guarded on both server and editor open paths', () => {
  const serverSource = readSource('server/index.js');
  const fileOperationsSource = readSource('server/fileOperations.js');
  const openFileSource = readSource(
    'src/features/editorProvider/openFileForEditor.ts',
  );

  assert.equal(LARGE_TEXT_FILE_LIMIT, 1024 * 1024 * 2);
  assert.match(fileOperationsSource, /stat\.size > LARGE_TEXT_FILE_LIMIT/);
  assert.match(serverSource, /status\(413\)/);
  assert.match(openFileSource, /file\.size > LARGE_FILE_LIMIT/);
  assert.match(openFileSource, /!isLargeFile/);
});

test('file cursor persistence endpoints and Monaco integration are wired', () => {
  const serverSource = readSource('server/index.js');
  const dbSource = readSource('server/db.js');
  const monacoSource = readSource(
    'src/features/editorMonaco/useMonacoEditorLifecycle.ts',
  );
  const restoreViewSource = readSource(
    'src/features/editorMonaco/restoreEditorViewState.ts',
  );
  const saveClientSource = readSource('src/features/apiClient/fileApi.ts');
  const fetchClientSource = saveClientSource;

  assert.match(serverSource, /app\.get\('\/api\/file-cursor'/);
  assert.match(serverSource, /app\.put\('\/api\/file-cursor'/);
  assert.match(dbSource, /view_state TEXT/);
  assert.match(dbSource, /JSON\.stringify\(viewState\)/);
  assert.match(dbSource, /JSON\.parse\(row\.view_state\)/);
  assert.match(monacoSource, /fetchFileCursorPosition/);
  assert.match(monacoSource, /saveFileCursorPosition/);
  assert.match(monacoSource, /restoreEditorViewState/);
  assert.match(restoreViewSource, /restoreViewState/);
  assert.match(restoreViewSource, /revealPositionInCenterIfOutsideViewport/);
  assert.match(monacoSource, /saveViewState/);
  assert.match(monacoSource, /onDidScrollChange/);
  assert.match(saveClientSource, /viewState/);
  assert.match(fetchClientSource, /viewState/);
});

test('heavy panels are lazy loaded from the app shell', () => {
  const source = readSource('src/App.tsx');
  const bottomPanelSource = readSource(
    'src/components/BottomPanel/BottomPanel.tsx',
  );

  assert.match(
    source,
    /lazy\(\(\) => import\('\.\/components\/BottomPanel\/BottomPanel'\)\)/,
  );
  assert.match(
    source,
    /lazy\(\(\) => import\('\.\/components\/SettingsPanel\/SettingsPanel'\)\)/,
  );
  assert.match(bottomPanelSource, /<TerminalPanel \/>/);
  assert.match(bottomPanelSource, /<ProblemsPanel \/>/);
  assert.match(source, /<BottomPanel \/>/);
  assert.match(source, /state\.showSettings && <SettingsPanel \/>/);
});

test('keybinding recording bypasses global shortcut capture', () => {
  const globalSource = readSource(
    'src/features/editorProvider/useEditorKeybindings.ts',
  );
  const recordingSource = readSource(
    'src/components/SettingsPanel/SettingsKeybindingsTab.tsx',
  );
  const settingsSource = readSource(
    'src/components/SettingsPanel/SettingsPanel.tsx',
  );
  const comboSource = readSource(
    'src/features/settingsKeybindings/createKeyComboFromEvent.ts',
  );

  assert.match(globalSource, /if \(isKeybindingRecordingEvent\(e\)\) return/);
  assert.match(
    globalSource,
    /if \(isEditableKeyboardTarget\(e\.target\) && !isMonacoKeyboardTarget\(e\.target\)\) return/,
  );
  assert.match(recordingSource, /data-keybinding-recording="true"/);
  assert.match(settingsSource, /if \(e\.key === 'Escape'\)/);
  assert.match(comboSource, /includes\(key\)\) return null/);
});

test('SQLite migrations advance a legacy schema to the current version', () => {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE schema_version (version INTEGER NOT NULL);
    CREATE TABLE editor_state (id INTEGER PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE file_cursor_positions (
      path TEXT PRIMARY KEY,
      line INTEGER NOT NULL,
      column INTEGER NOT NULL
    );
  `);

  assert.equal(runMigrations(db), CURRENT_SCHEMA_VERSION);
  assert.equal(
    db.prepare('SELECT version FROM schema_version').get().version,
    CURRENT_SCHEMA_VERSION,
  );
  assert.equal(
    db
      .prepare(
        "SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table' AND name = 'recovery_buffers'",
      )
      .get().count,
    1,
  );
  db.close();
});

test('database startup creates and restores a pre-migration backup path', () => {
  const source = readSource('server/db.js');
  assert.match(source, /blinkcode\.pre-migration\.bak/);
  assert.match(source, /copyFileSync\(DB_PATH, MIGRATION_BACKUP_PATH\)/);
  assert.match(source, /copyFileSync\(MIGRATION_BACKUP_PATH, DB_PATH\)/);
});

test('recovery buffers are persisted, restored and cleared after save', () => {
  const dbSource = readSource('server/db.js');
  const serverSource = readSource('server/index.js');
  const hookSource = readSource(
    'src/features/editorProvider/useRecoveryBuffers.ts',
  );
  const loadSource = readSource(
    'src/features/editorProvider/loadWorkspaceFromServer.ts',
  );
  const saveSource = readSource('src/features/editorProvider/saveFileNode.ts');
  const tabActionsSource = readSource('src/features/tabs/useTabMenuActions.ts');
  const persistenceActionsSource = readSource(
    'src/features/editorProvider/useFilePersistenceActions.ts',
  );

  assert.match(dbSource, /CREATE TABLE IF NOT EXISTS recovery_buffers/);
  assert.match(serverSource, /app\.put\('\/api\/recovery'/);
  assert.match(hookSource, /saveRecoveryBuffer/);
  assert.match(loadSource, /fetchRecoveryBuffers/);
  assert.match(saveSource, /deleteRecoveryBuffer/);
  assert.match(tabActionsSource, /const dontSave = async/);
  assert.match(tabActionsSource, /await discardTabChanges\(menuTabId\)/);
  assert.match(
    persistenceActionsSource,
    /await deleteRecoveryBuffer\(file\.serverPath\)/,
  );
  assert.match(
    persistenceActionsSource,
    /fetchFileContent\(file\.serverPath\)/,
  );
});

test('server and Electron enforce baseline security restrictions', () => {
  const headerSource = readSource('server/securityHeaders.js');
  const serverSource = readSource('server/index.js');
  const electronSource = readSource('electron/main.mjs');

  assert.match(headerSource, /Content-Security-Policy/);
  assert.match(headerSource, /object-src 'none'/);
  assert.match(headerSource, /X-Content-Type-Options/);
  assert.match(serverSource, /app\.post\('\/api\/session'/);
  assert.match(serverSource, /localServerAuth\.requireApiSession/);
  assert.match(serverSource, /localServerAuth\.authorizeWebSocket/);
  assert.match(serverSource, /host = '127\.0\.0\.1'/);
  assert.match(serverSource, /server\.listen\(port, host/);
  assert.match(electronSource, /setPermissionRequestHandler/);
  assert.match(electronSource, /will-navigate/);
  assert.match(electronSource, /contextIsolation: true/);
  assert.match(electronSource, /nodeIntegration: false/);
});

test('settings footer reads the installed Electron app version', () => {
  const mainSource = readSource('electron/main.mjs');
  const footerSource = readSource(
    'src/components/SettingsPanel/SettingsFooter.tsx',
  );
  const versionSource = readSource('src/features/appVersion/useAppVersion.ts');

  assert.match(
    mainSource,
    /ipcMain\.handle\('app:get-version', \(\) => app\.getVersion\(\)\)/,
  );
  assert.match(footerSource, /useAppVersion\(\)/);
  assert.doesNotMatch(footerSource, /v1\.3\.4/);
  assert.match(versionSource, /getAppVersion/);
});

test('NPM scripts discovery includes nested packages and ignores dependencies', () => {
  const workspace = mkdtempSync(resolve(tmpdir(), 'blinkcode-npm-scripts-'));

  try {
    mkdirSync(resolve(workspace, 'packages/client'), { recursive: true });
    mkdirSync(resolve(workspace, 'node_modules/ignored'), { recursive: true });
    writeFileSync(
      resolve(workspace, 'package.json'),
      JSON.stringify({
        name: 'root-package',
        scripts: { dev: 'vite', test: 'node --test' },
      }),
    );
    writeFileSync(resolve(workspace, 'pnpm-lock.yaml'), 'lockfileVersion: 9');
    writeFileSync(
      resolve(workspace, 'packages/client/package.json'),
      JSON.stringify({
        name: 'client-package',
        scripts: { build: 'vite build' },
      }),
    );
    writeFileSync(resolve(workspace, 'packages/client/yarn.lock'), '');
    writeFileSync(
      resolve(workspace, 'node_modules/ignored/package.json'),
      JSON.stringify({
        name: 'ignored-package',
        scripts: { hidden: 'echo hidden' },
      }),
    );

    const packages = findNpmScripts(workspace);
    assert.equal(packages.length, 2);
    assert.deepEqual(
      packages.map((item) => [item.directory, item.packageManager]),
      [
        ['.', 'pnpm'],
        ['packages/client', 'yarn'],
      ],
    );
    assert.deepEqual(
      packages[0].scripts.map((script) => script.name),
      ['dev', 'test'],
    );
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test('NPM scripts panel launches tracked terminal processes', () => {
  const panelSource = readSource(
    'src/components/NpmScriptsPanel/NpmScriptsPanel.tsx',
  );
  const commandSource = readSource(
    'src/features/npmScripts/createNpmRunCommand.ts',
  );
  const shellSource = readSource('src/hooks/useShell.ts');
  const ptySource = readSource('server/pty.js');

  assert.match(panelSource, /scriptKey:/);
  assert.match(panelSource, /startupCommand: createNpmRunCommand/);
  assert.match(commandSource, /quoteShellArgument/);
  assert.match(shellSource, /type: 'start', cwd, command/);
  assert.match(ptySource, /'-Command', command/);
  assert.match(ptySource, /'-lc', command/);
  assert.match(ptySource, /if \(!session \|\| session\.exited\) return/);
});

test('advanced IDE completion features remain wired', () => {
  const searchServer = readSource('server/search.js');
  const searchRoute = readSource('server/index.js');
  const lspClient = readSource('src/lsp/client.ts');
  const statusBar = readSource('src/components/StatusBar/StatusBar.tsx');
  const largePreview = readSource(
    'src/components/CodeEditor/LargeFilePreview.tsx',
  );
  const saveFile = readSource('src/features/editorProvider/saveFileNode.ts');
  const sourceControl = readSource(
    'src/components/SourceControl/SourceControlChangesList.tsx',
  );

  assert.match(searchServer, /execFileSync\('rg'/);
  assert.match(searchRoute, /app\.post\('\/api\/search\/stream'/);
  assert.match(lspClient, /async restart\(\)/);
  assert.match(statusBar, /restartAllLspSessions/);
  assert.match(largePreview, /tt\('preview\.loadNext'\)/);
  assert.match(saveFile, /settings\.insertFinalNewline/);
  assert.match(sourceControl, /tt\('sc\.mergeConflicts'\)/);
});

test('Monaco is bundled locally instead of relying on a blocked CDN', () => {
  const setup = readSource('src/features/editorMonaco/configureLocalMonaco.ts');
  const main = readSource('src/main.tsx');
  const headers = readSource('server/securityHeaders.js');

  assert.match(setup, /loader\.config\(\{ monaco \}\)/);
  assert.match(setup, /editor\.worker\?worker/);
  assert.match(setup, /typescript\/ts\.worker\?worker/);
  assert.match(main, /configureLocalMonaco\(\)/);
  assert.match(headers, /worker-src 'self' blob:/);
});

test('tag releases publish Windows artifacts to GitHub Releases', () => {
  const workflow = readSource('.github/workflows/release.yml');
  assert.match(workflow, /tags:/);
  assert.match(workflow, /npm run release:check/);
  assert.match(workflow, /npm run dist:win/);
  assert.match(workflow, /softprops\/action-gh-release@v2/);
  assert.match(workflow, /BlinkCode-Portable-\*\.exe/);
});

test('quality workflows do not fetch the unavailable legacy submodule', () => {
  const workflow = readSource('.github/workflows/quality.yml');
  assert.doesNotMatch(workflow, /submodules:\s*(recursive|true)/);
  assert.match(
    workflow,
    /actions\/checkout@08eba0b27e820071cde6df949e0beb9ba4906955/,
  );
});

test('Windows updates use the silent one-click NSIS update path', () => {
  const packageSource = readSource('package.json');
  const updaterSource = readSource('electron/registerUpdaterIpc.mjs');
  assert.match(packageSource, /"oneClick": true/);
  assert.match(packageSource, /"perMachine": false/);
  assert.doesNotMatch(
    packageSource,
    /"allowToChangeInstallationDirectory": true/,
  );
  assert.match(updaterSource, /quitAndInstall\(true, true\)/);
});
