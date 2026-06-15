export type DiffHunk = {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  type: 'added' | 'deleted' | 'modified';
};

export type AlignedDiffLine = {
  left: string;
  right: string;
  kind: '' | 'added' | 'removed' | 'modified';
};
