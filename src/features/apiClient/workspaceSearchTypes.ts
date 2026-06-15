export interface WorkspaceSearchOptions {
  query: string;
  replacement?: string;
  regex?: boolean;
  matchCase?: boolean;
  wholeWord?: boolean;
  include?: string;
  exclude?: string;
}

export interface WorkspaceSearchMatch {
  line: number;
  column: number;
  length: number;
  preview: string;
}

export interface WorkspaceSearchFileResult {
  path: string;
  matches: WorkspaceSearchMatch[];
}

export interface WorkspaceSearchResponse {
  results: WorkspaceSearchFileResult[];
  totalMatches: number;
  truncated: boolean;
  engine?: 'node' | 'ripgrep';
}
