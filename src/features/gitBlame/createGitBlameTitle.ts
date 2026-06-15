import type { GitBlameLineInfo } from '../../utils/api';

export function createGitBlameTitle(blameInfo: GitBlameLineInfo | null): string {
  if (!blameInfo) return '';
  return `${blameInfo.author}\n${blameInfo.summary}\n${blameInfo.commit}\n${new Date((blameInfo.authorTime || 0) * 1000).toLocaleString()}`;
}
