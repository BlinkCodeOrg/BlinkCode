export interface GitFileEntry {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'untracked' | 'conflict';
}

export interface GitStatusResponse {
  isRepo: boolean;
  branch: string | null;
  staged: GitFileEntry[];
  unstaged: GitFileEntry[];
  untracked: GitFileEntry[];
  conflicts: GitFileEntry[];
  roots: Array<{ id: string; name: string; ref: string; primary: boolean }>;
}

export interface GitFileDiffResponse {
  path: string;
  original: string;
  modified: string;
  staged: boolean;
  status: GitFileEntry['status'];
}

export interface GitInlineDiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  type: 'added' | 'deleted' | 'modified';
}

export interface GitInlineDiffResponse {
  path: string;
  staged: boolean;
  status: GitFileEntry['status'];
  hunks: GitInlineDiffHunk[];
}

export interface GitBlameLineInfo {
  commit: string;
  shortCommit: string;
  author: string;
  authorTime: number;
  summary: string;
}

export interface GitBlameLineResponse {
  path: string;
  line: number;
  blame: GitBlameLineInfo | null;
}
