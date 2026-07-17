import assert from 'node:assert/strict';
import test from 'node:test';
import { restoreEditorViewState } from '../../src/features/editorMonaco/restoreEditorViewState';

test('restored Monaco view state always reveals a valid cursor position', () => {
  const calls: Array<[string, unknown]> = [];
  const editor = {
    getModel: () => ({
      getLineCount: () => 35,
      getLineMaxColumn: (line: number) => (line === 35 ? 62 : 10),
    }),
    restoreViewState: (viewState: unknown) =>
      calls.push(['restore', viewState]),
    setPosition: (position: unknown) => calls.push(['position', position]),
    revealPositionInCenterIfOutsideViewport: (position: unknown) =>
      calls.push(['reveal', position]),
    focus: () => calls.push(['focus', null]),
  };

  restoreEditorViewState(editor, {
    line: 999,
    column: 999,
    viewState: { scrollTop: 999999 },
  });

  const expectedPosition = { lineNumber: 35, column: 62 };
  assert.deepEqual(calls, [
    ['restore', { scrollTop: 999999 }],
    ['position', expectedPosition],
    ['reveal', expectedPosition],
    ['focus', null],
  ]);
});
