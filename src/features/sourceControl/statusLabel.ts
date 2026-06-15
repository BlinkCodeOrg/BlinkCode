import type { GitFileEntry } from '../../utils/api';

export function statusLabel(status: GitFileEntry['status']): string {
  switch (status) {
    case 'added':
      return 'A';
    case 'modified':
      return 'M';
    case 'deleted':
      return 'D';
    case 'untracked':
      return 'U';
    case 'conflict':
      return '!';
  }
}
