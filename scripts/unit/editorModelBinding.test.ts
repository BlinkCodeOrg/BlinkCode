import assert from 'node:assert/strict';
import test from 'node:test';
import { doesEditorModelMatchFile } from '../../src/features/editorMonaco/doesEditorModelMatchFile';

function editorWithModelPath(path: string) {
  return {
    getModel: () => ({ uri: { path } }),
  };
}

test('Monaco changes are accepted only for the file owning the active model', () => {
  const editor = editorWithModelPath('/workspace/src/current.ts');
  assert.equal(doesEditorModelMatchFile(editor, 'src/current.ts'), true);
  assert.equal(doesEditorModelMatchFile(editor, 'src/next.ts'), false);
  assert.equal(doesEditorModelMatchFile(editor, 'assets/encoded.bin'), false);
});

test('Monaco model matching handles encoded spaces and Windows separators', () => {
  assert.equal(
    doesEditorModelMatchFile(
      editorWithModelPath('/project/My%20File.ts'),
      'My File.ts',
    ),
    true,
  );
  assert.equal(
    doesEditorModelMatchFile(
      editorWithModelPath('C:/project/src/app.ts'),
      'src\\app.ts',
    ),
    true,
  );
});
