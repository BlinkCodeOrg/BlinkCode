import type { GitFileEntry, GitStatusResponse } from '../../utils/api';

export interface ExplorerGitDecoration {
  label: 'A' | 'M' | 'U' | 'D' | 'C';
  status: GitFileEntry['status'];
}

const decorationByStatus: Record<GitFileEntry['status'], ExplorerGitDecoration> = {
  added: { label: 'A', status: 'added' },
  modified: { label: 'M', status: 'modified' },
  untracked: { label: 'U', status: 'untracked' },
  deleted: { label: 'D', status: 'deleted' },
  conflict: { label: 'C', status: 'conflict' },
};

const priority: Record<ExplorerGitDecoration['label'], number> = {
  U: 1,
  A: 2,
  M: 3,
  D: 4,
  C: 5,
};

export function createExplorerGitDecorations(status: GitStatusResponse | null) {
  const decorations = new Map<string, ExplorerGitDecoration>();
  if (!status?.isRepo) return decorations;

  const apply = (path: string, decoration: ExplorerGitDecoration) => {
    const current = decorations.get(path);
    if (!current || priority[decoration.label] > priority[current.label]) {
      decorations.set(path, decoration);
    }
  };

  const applyEntry = (entry: GitFileEntry) => {
    const normalizedPath = entry.path.replace(/\\/g, '/').replace(/^\.\/|\/$/g, '');
    if (!normalizedPath) return;
    const decoration = decorationByStatus[entry.status];
    apply(normalizedPath, decoration);

    const segments = normalizedPath.split('/');
    for (let index = segments.length - 1; index > 0; index -= 1) {
      apply(segments.slice(0, index).join('/'), decoration);
    }
  };

  status.staged.forEach(applyEntry);
  status.unstaged.forEach(applyEntry);
  status.untracked.forEach(applyEntry);
  status.conflicts.forEach(applyEntry);
  return decorations;
}
