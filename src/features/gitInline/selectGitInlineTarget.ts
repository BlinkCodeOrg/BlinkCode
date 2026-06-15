import type { GitFileEntry, GitStatusResponse } from '../../utils/api';
import { findGitFileEntry } from './findGitFileEntry';

export function selectGitInlineTarget(status: GitStatusResponse, serverPath: string): {
  staged: GitFileEntry | null;
  target: GitFileEntry | null;
  unstaged: GitFileEntry | null;
  untracked: GitFileEntry | null;
} {
  const unstaged = findGitFileEntry(status.unstaged, serverPath);
  const staged = findGitFileEntry(status.staged, serverPath);
  const untracked = findGitFileEntry(status.untracked, serverPath);

  return {
    staged,
    target: unstaged || staged || untracked,
    unstaged,
    untracked,
  };
}
