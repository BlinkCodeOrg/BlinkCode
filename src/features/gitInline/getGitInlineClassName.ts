import type { GitInlineHunk } from './gitInlineTypes';

export function getGitInlineClassName(type: GitInlineHunk['type']): string {
  if (type === 'added') return 'git-inline-added';
  if (type === 'deleted') return 'git-inline-deleted';
  return 'git-inline-modified';
}
