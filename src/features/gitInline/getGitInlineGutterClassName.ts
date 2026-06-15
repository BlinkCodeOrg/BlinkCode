import type { GitInlineHunk } from './gitInlineTypes';

export function getGitInlineGutterClassName(type: GitInlineHunk['type']): string {
  if (type === 'added') return 'git-inline-gutter-added';
  if (type === 'deleted') return 'git-inline-gutter-deleted';
  return 'git-inline-gutter-modified';
}
