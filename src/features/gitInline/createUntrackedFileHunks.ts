import type { GitInlineHunk } from './gitInlineTypes';

export function createUntrackedFileHunks(content: string): GitInlineHunk[] {
  const lineCount = Math.max(1, (content || '').split('\n').length);
  return [{ oldStart: 1, oldLines: 0, newStart: 1, newLines: lineCount, type: 'added' }];
}
