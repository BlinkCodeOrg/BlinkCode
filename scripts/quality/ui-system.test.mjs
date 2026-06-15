import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const sidebarSources = [
  'src/components/Sidebar/Sidebar.tsx',
  'src/components/SearchPanel/SearchPanel.tsx',
  'src/components/SourceControl/SourceControl.tsx',
  'src/components/NpmScriptsPanel/NpmScriptsPanel.tsx',
  'src/components/DebugPanel/DebugPanel.tsx',
  'src/components/ExtensionsPanel/ExtensionsPanel.tsx',
];

test('left sidebar panels use the shared panel shell', async () => {
  for (const path of sidebarSources) {
    const source = await readFile(path, 'utf8');
    assert.match(source, /<SidebarPanel\b/, `${path} must use SidebarPanel`);
    assert.match(source, /ui-sidebar-resizer/, `${path} must use the shared resizer`);
  }
  for (const path of [
    'src/components/Sidebar/SidebarHeader.tsx',
    'src/components/SearchPanel/SearchPanel.tsx',
    'src/components/SourceControl/SourceControlHeader.tsx',
    'src/components/NpmScriptsPanel/NpmScriptsPanel.tsx',
    'src/components/DebugPanel/DebugPanel.tsx',
    'src/components/ExtensionsPanel/ExtensionsPanel.tsx',
  ]) {
    assert.match(await readFile(path, 'utf8'), /ui-sidebar-panel-header/, `${path} must use the shared header`);
  }
});

test('custom controls replace native project selectors and confirmations', async () => {
  const files = [
    'src/components/SettingsPanel/SettingsAppearanceSection.tsx',
    'src/components/SettingsPanel/SettingsEditorSection.tsx',
    'src/components/SettingsPanel/SettingsFilesSection.tsx',
    'src/components/NpmScriptsPanel/DependencyManager.tsx',
    'src/components/DebugPanel/DebugPanel.tsx',
    'src/components/RestClient/RestClientBar.tsx',
  ];
  const source = (await Promise.all(files.map(path => readFile(path, 'utf8')))).join('\n');
  assert.doesNotMatch(source, /<select\b/);
  assert.doesNotMatch(source, /window\.confirm/);
  assert.match(source, /<Select\b/);
});

test('project overlays use the shared modal', async () => {
  for (const path of [
    'src/components/SettingsPanel/SettingsPanel.tsx',
    'src/components/CommandPalette/CommandPalette.tsx',
    'src/components/QuickOpen/QuickOpen.tsx',
    'src/components/SourceControl/DiscardConfirmModal.tsx',
  ]) {
    const source = await readFile(path, 'utf8');
    assert.match(source, /<Modal\b|<ConfirmDialog\b/, `${path} must use a shared overlay component`);
  }
  assert.doesNotMatch(
    await readFile('src/features/editorProvider/useFileSystemWatcher.ts', 'utf8'),
    /window\.confirm/,
  );
});
