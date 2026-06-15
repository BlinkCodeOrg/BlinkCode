export interface GitInlineHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  type: 'added' | 'deleted' | 'modified';
}
