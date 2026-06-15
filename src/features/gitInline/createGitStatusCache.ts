import type { GitFileEntry, GitStatusResponse } from '../../utils/api';

export function createGitStatusCache(status: GitStatusResponse): GitFileEntry[] {
  return [...status.unstaged, ...status.staged, ...status.untracked];
}
