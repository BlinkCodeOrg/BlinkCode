import { getGitInlineClassName } from './getGitInlineClassName';
import { getGitInlineGutterClassName } from './getGitInlineGutterClassName';
import type { GitInlineHunk } from './gitInlineTypes';

export function createGitInlineDecorations(monaco: any, hunks: GitInlineHunk[]): any[] {
  return (hunks || []).map(hunk => {
    const start = Math.max(1, hunk.newStart || 1);
    const len = Math.max(1, hunk.newLines || 1);
    const end = start + len - 1;

    return {
      range: new monaco.Range(start, 1, end, 1),
      options: {
        isWholeLine: true,
        className: getGitInlineClassName(hunk.type),
        linesDecorationsClassName: getGitInlineGutterClassName(hunk.type),
      },
    };
  });
}
