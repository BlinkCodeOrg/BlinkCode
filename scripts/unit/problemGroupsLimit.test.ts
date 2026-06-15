import assert from 'node:assert/strict';
import test from 'node:test';
import { limitProblemGroups } from '../../src/features/problems/limitProblemGroups';
import type { DiagnosticItem, FileGroup } from '../../src/features/problems/problemTypes';

const item = (relPath: string, line: number): DiagnosticItem => ({
  severity: 8,
  message: `Problem ${line}`,
  startLineNumber: line,
  startColumn: 1,
  endLineNumber: line,
  endColumn: 2,
  source: 'test',
  resource: `file:///${relPath}`,
  relPath,
});

const group = (relPath: string, count: number): FileGroup => ({
  relPath,
  resource: `file:///${relPath}`,
  items: Array.from({ length: count }, (_, index) => item(relPath, index + 1)),
  errors: count,
  warnings: 0,
  infos: 0,
});

test('limits mounted diagnostics across file groups', () => {
  const visible = limitProblemGroups([group('a.ts', 180), group('b.ts', 180)], 250);
  assert.equal(visible.length, 2);
  assert.equal(visible[0].items.length, 180);
  assert.equal(visible[1].items.length, 70);
  assert.equal(visible.flatMap(entry => entry.items).length, 250);
});
