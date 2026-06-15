import assert from 'node:assert/strict';
import test from 'node:test';
import type { EditorState, FileNode } from '../../src/types';
import { reducer } from '../../src/features/editorState/reducer';
import { findNodeByPath } from '../../src/features/workspaceTree/findNodeByPath';

const files: FileNode[] = [
  {
    id: 'src',
    name: 'src',
    type: 'folder',
    serverPath: 'src',
    isExpanded: true,
    children: [
      { id: 'a', name: 'a.ts', type: 'file', serverPath: 'src/a.ts', language: 'typescript', content: 'a' },
      { id: 'b', name: 'b.js', type: 'file', serverPath: 'src/b.js', language: 'javascript', content: 'b' },
    ],
  },
  { id: 'readme', name: 'README.md', type: 'file', serverPath: 'README.md', language: 'markdown', content: '# Readme' },
];

function state(overrides: Partial<EditorState> = {}): EditorState {
  return {
    files: structuredClone(files),
    openTabs: [],
    activeTabId: null,
    splitActiveTabId: null,
    viewMode: 'editor',
    browserOpen: false,
    browserUrl: null,
    browserLoading: false,
    browserCanGoBack: false,
    browserCanGoForward: false,
    browserError: null,
    showAIPanel: false,
    showSettings: false,
    showSearchPanel: false,
    showSourceControl: false,
    showExtensions: false,
    showNpmScripts: false,
    showDebugPanel: false,
    showProblemsPanel: false,
    zenMode: false,
    sidebarWidth: 250,
    sidebarVisible: true,
    toasts: [],
    terminalOpen: false,
    terminalHeight: 220,
    bottomPanelTab: 'terminal',
    bottomPanelMaximized: false,
    bottomPanelOpen: false,
    terminalInstances: [],
    activeTerminalId: null,
    settings: {} as EditorState['settings'],
    pendingCreate: null,
    workspaceDir: 'C:/workspace',
    ...overrides,
  };
}

test('OPEN_FILE creates one tab and reuses it on repeated open', () => {
  const file = files[0].children![0];
  const opened = reducer(state(), { type: 'OPEN_FILE', payload: { file } });
  const repeated = reducer(opened, { type: 'OPEN_FILE', payload: { file } });

  assert.equal(opened.openTabs.length, 1);
  assert.equal(repeated.openTabs.length, 1);
  assert.equal(repeated.activeTabId, opened.openTabs[0].id);
});

test('content updates distinguish dirty edits from server loads and save completion', () => {
  const dirty = reducer(state(), { type: 'UPDATE_FILE_CONTENT', payload: { fileId: 'a', content: 'changed' } });
  assert.equal(findNodeByPath(dirty.files, 'src/a.ts')?.dirty, true);

  const loaded = reducer(dirty, { type: 'SET_FILE_CONTENT', payload: { fileId: 'a', content: 'disk' } });
  assert.equal(findNodeByPath(loaded.files, 'src/a.ts')?.content, 'disk');
  assert.equal(findNodeByPath(loaded.files, 'src/a.ts')?.dirty, false);

  const saved = reducer({ ...dirty, pendingCreate: { type: 'file' } }, { type: 'MARK_FILE_SAVED', payload: { fileId: 'a' } });
  assert.equal(findNodeByPath(saved.files, 'src/a.ts')?.dirty, false);
  assert.equal(saved.pendingCreate, null);
});

test('closing the active tab selects a neighbour and clears its split assignment', () => {
  const current = state({
    openTabs: [
      { id: 'tab-a', fileId: 'a', name: 'a.ts' },
      { id: 'tab-b', fileId: 'b', name: 'b.js' },
    ],
    activeTabId: 'tab-a',
    splitActiveTabId: 'tab-a',
  });
  const next = reducer(current, { type: 'CLOSE_TAB', payload: { tabId: 'tab-a' } });
  assert.deepEqual(next.openTabs.map(tab => tab.id), ['tab-b']);
  assert.equal(next.activeTabId, 'tab-b');
  assert.equal(next.splitActiveTabId, null);
});

test('dirty tabs cannot be closed by regular close actions', () => {
  const current = state({
    files: [{
      ...structuredClone(files[0]),
      children: [{ ...structuredClone(files[0].children![0]), dirty: true }],
    }, structuredClone(files[1])],
    openTabs: [{ id: 'tab-a', fileId: 'a', name: 'a.ts' }],
    activeTabId: 'tab-a',
  });
  const next = reducer(current, { type: 'CLOSE_TAB', payload: { tabId: 'tab-a' } });
  assert.equal(next, current);
  assert.equal(next.openTabs.length, 1);
});

test('deleting a folder removes descendant tabs and selects the remaining tab', () => {
  const current = state({
    openTabs: [
      { id: 'tab-readme', fileId: 'readme', name: 'README.md' },
      { id: 'tab-a', fileId: 'a', name: 'a.ts' },
      { id: 'tab-b', fileId: 'b', name: 'b.js' },
    ],
    activeTabId: 'tab-a',
  });
  const next = reducer(current, { type: 'DELETE_NODE', payload: { nodeId: 'src' } });
  assert.equal(findNodeByPath(next.files, 'src'), null);
  assert.deepEqual(next.openTabs.map(tab => tab.id), ['tab-readme']);
  assert.equal(next.activeTabId, 'tab-readme');
});

test('rename updates the tree, tab title and language', () => {
  const current = state({
    openTabs: [{ id: 'tab-a', fileId: 'a', name: 'a.ts', language: 'typescript' }],
    activeTabId: 'tab-a',
  });
  const next = reducer(current, {
    type: 'RENAME_NODE',
    payload: { nodeId: 'a', newName: 'a.css', newServerPath: 'src/a.css' },
  });
  assert.equal(findNodeByPath(next.files, 'src/a.css')?.name, 'a.css');
  assert.equal(findNodeByPath(next.files, 'src/a.ts'), null);
  assert.equal(next.openTabs[0].name, 'a.css');
  assert.equal(next.openTabs[0].language, 'css');
});

test('move places a root file inside a folder and expands the destination', () => {
  const next = reducer(state(), {
    type: 'MOVE_NODE',
    payload: { nodeId: 'readme', targetId: 'src', position: 'inside', newServerPath: 'src/README.md' },
  });
  const folder = next.files.find(node => node.id === 'src');
  assert.equal(next.files.some(node => node.id === 'readme'), false);
  assert.equal(folder?.children?.some(node => node.id === 'readme'), true);
  assert.equal(folder?.children?.find(node => node.id === 'readme')?.serverPath, 'src/README.md');
  assert.equal(folder?.isExpanded, true);
});

test('watcher add is idempotent and watcher remove closes the matching tab', () => {
  const added = reducer(state(), {
    type: 'FS_ADD_NODE',
    payload: { serverPath: 'src/new.ts', name: 'new.ts', type: 'file' },
  });
  const duplicate = reducer(added, {
    type: 'FS_ADD_NODE',
    payload: { serverPath: 'src/new.ts', name: 'new.ts', type: 'file' },
  });
  const node = findNodeByPath(duplicate.files, 'src/new.ts')!;
  assert.equal(duplicate.files[0].children?.filter(child => child.serverPath === 'src/new.ts').length, 1);

  const removed = reducer({
    ...duplicate,
    openTabs: [{ id: 'new-tab', fileId: node.id, name: node.name }],
    activeTabId: 'new-tab',
  }, { type: 'FS_REMOVE_NODE', payload: { serverPath: 'src/new.ts' } });
  assert.equal(findNodeByPath(removed.files, 'src/new.ts'), null);
  assert.equal(removed.openTabs.length, 0);
  assert.equal(removed.activeTabId, null);
});

test('watcher removal preserves a dirty open file', () => {
  const current = state({
    files: [{
      ...structuredClone(files[0]),
      children: [{ ...structuredClone(files[0].children![0]), dirty: true }],
    }, structuredClone(files[1])],
    openTabs: [{ id: 'tab-a', fileId: 'a', name: 'a.ts' }],
    activeTabId: 'tab-a',
  });
  const next = reducer(current, { type: 'FS_REMOVE_NODE', payload: { serverPath: 'src/a.ts' } });
  assert.equal(next, current);
  assert.equal(findNodeByPath(next.files, 'src/a.ts')?.dirty, true);
});

test('sidebar panels remain mutually exclusive', () => {
  const search = reducer(state(), { type: 'TOGGLE_SEARCH_PANEL' });
  const sourceControl = reducer(search, { type: 'TOGGLE_SOURCE_CONTROL' });
  assert.equal(sourceControl.showSearchPanel, false);
  assert.equal(sourceControl.showSourceControl, true);
  assert.equal(sourceControl.showNpmScripts, false);
  assert.equal(sourceControl.sidebarVisible, true);
  const extensions = reducer(sourceControl, { type: 'TOGGLE_EXTENSIONS' });
  assert.equal(extensions.showSourceControl, false);
  assert.equal(extensions.showExtensions, true);
});

test('tabs can be pinned and bottom panel state is coordinated', () => {
  const current = state({ openTabs: [{ id: 'tab-a', fileId: 'a', name: 'a.ts' }] });
  const pinned = reducer(current, { type: 'TOGGLE_PIN_TAB', payload: { tabId: 'tab-a' } });
  assert.equal(pinned.openTabs[0].pinned, true);

  const terminal = reducer(pinned, { type: 'TOGGLE_TERMINAL' });
  assert.equal(terminal.bottomPanelOpen, true);
  assert.equal(terminal.bottomPanelTab, 'terminal');

  const output = reducer(terminal, { type: 'SET_BOTTOM_PANEL_TAB', payload: { tab: 'output' } });
  assert.equal(output.bottomPanelTab, 'output');

  const closed = reducer(output, { type: 'SET_BOTTOM_PANEL_OPEN', payload: { open: false } });
  assert.equal(closed.bottomPanelOpen, false);
  assert.equal(closed.terminalOpen, false);
});

test('browser actions reset navigation and error state when opened and closed', () => {
  const opened = reducer(state({ browserError: 'old' }), {
    type: 'OPEN_BROWSER_PREVIEW',
    payload: { url: 'http://localhost:5173' },
  });
  assert.equal(opened.browserOpen, true);
  assert.equal(opened.browserLoading, true);
  assert.equal(opened.browserError, null);

  const closed = reducer(opened, { type: 'CLOSE_BROWSER_PREVIEW' });
  assert.equal(closed.browserOpen, false);
  assert.equal(closed.browserLoading, false);
  assert.equal(closed.browserCanGoBack, false);
});

test('terminal reducer activates new terminals, clamps height and selects a fallback on close', () => {
  const first = reducer(state(), {
    type: 'ADD_TERMINAL_INSTANCE',
    payload: { id: 'one', name: 'Terminal 1', cwd: '' },
  });
  const second = reducer(first, {
    type: 'ADD_TERMINAL_INSTANCE',
    payload: { id: 'two', name: 'Terminal 2', cwd: '' },
  });
  const resized = reducer(second, { type: 'SET_TERMINAL_HEIGHT', payload: { height: 9999 } });
  const closed = reducer(resized, { type: 'REMOVE_TERMINAL_INSTANCE', payload: { id: 'two' } });

  assert.equal(second.activeTerminalId, 'two');
  assert.equal(resized.terminalHeight, 500);
  assert.equal(closed.activeTerminalId, 'one');
  assert.equal(closed.terminalOpen, true);
});

test('session restore recreates active and split tabs from server paths', () => {
  const restored = reducer(state(), {
    type: 'RESTORE_STATE',
    payload: {
      openTabs: [
        { serverPath: 'src/a.ts', name: 'a.ts', language: 'typescript' },
        { serverPath: 'src/b.js', name: 'b.js', language: 'javascript' },
      ],
      activeTabServerPath: 'src/a.ts',
      splitActiveTabServerPath: 'src/b.js',
      sidebarWidth: 320,
    },
  });

  assert.equal(restored.openTabs.length, 2);
  assert.equal(restored.openTabs.find(tab => tab.id === restored.activeTabId)?.fileId, 'a');
  assert.equal(restored.openTabs.find(tab => tab.id === restored.splitActiveTabId)?.fileId, 'b');
  assert.equal(restored.viewMode, 'split');
  assert.equal(restored.sidebarWidth, 320);
});

test('numeric UI dimensions are clamped by the reducer', () => {
  assert.equal(reducer(state(), { type: 'SET_SIDEBAR_WIDTH', payload: { width: 10 } }).sidebarWidth, 180);
  assert.equal(reducer(state(), { type: 'SET_SIDEBAR_WIDTH', payload: { width: 1000 } }).sidebarWidth, 420);
});

test('extension detail tabs stay virtual and close an existing editor split', () => {
  const splitState = state({
    openTabs: [
      { id: 'tab-a', fileId: 'a', name: 'a.ts', language: 'typescript' },
      { id: 'tab-b', fileId: 'b', name: 'b.js', language: 'javascript' },
    ],
    activeTabId: 'tab-a',
    splitActiveTabId: 'tab-b',
    viewMode: 'split' as const,
  });
  const extensionNode = {
    id: 'extension-detail:demo.extension',
    name: 'Demo Extension',
    type: 'file' as const,
    language: 'extension-detail',
    extensionDetail: {
      id: 'demo.extension',
      displayName: 'Demo Extension',
      publisher: 'demo',
      version: '1.0.0',
      description: 'Demo',
      categories: ['Other'],
      permissions: [],
      iconDataUrl: 'data:image/svg+xml;base64,',
      readme: '# Demo',
      cacheSizeBytes: 10,
      packageSizeBytes: 20,
      installedAt: null,
      license: 'MIT',
      publishedAt: null,
      lastUpdatedAt: null,
      lastReleasedAt: null,
      resources: {},
    },
  };
  const opened = reducer(splitState, { type: 'OPEN_EXTENSION_DETAIL', payload: { node: extensionNode } });
  assert.equal(opened.splitActiveTabId, null);
  assert.equal(opened.viewMode, 'editor');
  assert.equal(opened.files.find(node => node.id === extensionNode.id)?.serverPath, undefined);
  const detailTab = opened.openTabs.find(tab => tab.fileId === extensionNode.id);
  const splitAttempt = reducer(opened, { type: 'SPLIT_TAB', payload: { tabId: detailTab!.id } });
  assert.equal(splitAttempt.splitActiveTabId, null);
  const reopenedSplit = { ...opened, activeTabId: 'tab-a', splitActiveTabId: 'tab-b', viewMode: 'split' as const };
  const activated = reducer(reopenedSplit, { type: 'SET_ACTIVE_TAB', payload: { tabId: detailTab!.id } });
  assert.equal(activated.splitActiveTabId, null);
  assert.equal(activated.viewMode, 'editor');
});
