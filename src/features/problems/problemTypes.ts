export interface DiagnosticItem {
  severity: number;
  message: string;
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
  source: string;
  code?: string;
  resource: string;
  relPath: string;
}

export interface FileGroup {
  relPath: string;
  resource: string;
  items: DiagnosticItem[];
  errors: number;
  warnings: number;
  infos: number;
}

export type ProblemCounts = {
  errors: number;
  warnings: number;
  infos: number;
};
