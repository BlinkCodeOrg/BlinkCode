import { getDiagnosticRelPath } from './getDiagnosticRelPath';
import type { DiagnosticItem, FileGroup, ProblemCounts } from './problemTypes';

type MarkerLike = {
  severity: number;
  message: string;
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
  source?: string;
  code?: unknown;
  resource?: { toString?: () => string };
};

export function buildProblemGroups(markers: MarkerLike[], workspaceDir: string): { groups: FileGroup[]; counts: ProblemCounts } {
  const fileMap = new Map<string, DiagnosticItem[]>();

  for (const marker of markers) {
    const uri = marker.resource?.toString?.() || '';
    const relPath = getDiagnosticRelPath(uri, workspaceDir);
    const item: DiagnosticItem = {
      severity: marker.severity,
      message: marker.message,
      startLineNumber: marker.startLineNumber,
      startColumn: marker.startColumn,
      endLineNumber: marker.endLineNumber,
      endColumn: marker.endColumn,
      source: marker.source || '',
      code: typeof marker.code === 'object' ? (marker.code as { value?: string })?.value : marker.code != null ? String(marker.code) : undefined,
      resource: uri,
      relPath,
    };
    if (!fileMap.has(relPath)) fileMap.set(relPath, []);
    fileMap.get(relPath)!.push(item);
  }

  const groups: FileGroup[] = [];
  const counts: ProblemCounts = { errors: 0, warnings: 0, infos: 0 };

  for (const [relPath, items] of fileMap) {
    items.sort((a, b) => a.startLineNumber - b.startLineNumber);
    const errors = items.filter(i => i.severity === 8).length;
    const warnings = items.filter(i => i.severity === 4).length;
    const infos = items.length - errors - warnings;
    counts.errors += errors;
    counts.warnings += warnings;
    counts.infos += infos;
    groups.push({ relPath, resource: items[0].resource, items, errors, warnings, infos });
  }

  groups.sort((a, b) => {
    if (a.errors !== b.errors) return b.errors - a.errors;
    if (a.warnings !== b.warnings) return b.warnings - a.warnings;
    return a.relPath.localeCompare(b.relPath);
  });

  return { groups, counts };
}
