import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('editor typing does not trigger periodic Git or Problems polling', async () => {
  const gitDecorations = await readFile('src/features/gitInline/useGitInlineDecorations.ts', 'utf8');
  const problemsPanel = await readFile('src/components/ProblemsPanel/ProblemsPanel.tsx', 'utf8');

  assert.doesNotMatch(gitDecorations, /setInterval\s*\(/);
  assert.doesNotMatch(problemsPanel, /setInterval\s*\(/);
  assert.match(gitDecorations, /setTimeout\(applyGitDecorations/);
});

test('development desktop does not automatically open DevTools', async () => {
  const electronMain = await readFile('electron/main.mjs', 'utf8');
  assert.doesNotMatch(electronMain, /\.openDevTools\s*\(/);
  assert.match(electronMain, /toggleDevTools\s*\(/);
});

test('editor content updates use a non-blocking React transition', async () => {
  const editorContext = await readFile('src/store/EditorContext.tsx', 'utf8');
  assert.match(editorContext, /React\.startTransition/);
});

test('background persistence skips unchanged state and branch polling is throttled', async () => {
  const persistence = await readFile('src/features/editorProvider/usePersistEditorState.ts', 'utf8');
  const statusBar = await readFile('src/components/StatusBar/StatusBar.tsx', 'utf8');

  assert.match(persistence, /serialized === lastSavedRef\.current/);
  assert.match(persistence, /10_000/);
  assert.match(statusBar, /30_000/);
  assert.match(statusBar, /document\.visibilityState === 'visible'/);
});
