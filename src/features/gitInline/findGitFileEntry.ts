import type { GitFileEntry } from '../../utils/api';

export function findGitFileEntry(items: GitFileEntry[], serverPath: string): GitFileEntry | null {
  return items.find(item => item.path === serverPath) || null;
}
