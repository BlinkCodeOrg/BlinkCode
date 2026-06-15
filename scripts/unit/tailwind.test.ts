import assert from 'node:assert/strict';
import test from 'node:test';
import { findTailwindClassRanges } from '../../src/features/tailwind/findTailwindClassRanges';
import { getTailwindClassPreview } from '../../src/features/tailwind/getTailwindClassPreview';
import { sortTailwindClasses } from '../../src/features/tailwind/sortTailwindClasses';

test('finds Tailwind utilities in HTML and JSX class attributes', () => {
  assert.deepEqual(
    findTailwindClassRanges('<div class="p-4 flex"></div>').map(item => item.className),
    ['p-4', 'flex'],
  );
  assert.deepEqual(
    findTailwindClassRanges('<div className={"text-white bg-black"} />').map(item => item.className),
    ['text-white', 'bg-black'],
  );
});

test('builds CSS previews and sorts utility classes', () => {
  assert.equal(getTailwindClassPreview('hover:bg-blue-500'), 'background-color: #3b82f6;');
  assert.equal(sortTailwindClasses('text-white p-4 flex bg-black'), 'flex p-4 bg-black text-white');
});
