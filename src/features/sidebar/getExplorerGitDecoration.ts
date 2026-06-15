import type { ExplorerGitDecoration } from './createExplorerGitDecorations';

const inheritedStatuses = new Set<ExplorerGitDecoration['status']>(['untracked', 'added', 'deleted']);

export function getExplorerGitDecoration(
  path: string,
  decorations: Map<string, ExplorerGitDecoration>,
): ExplorerGitDecoration | undefined {
  const normalized = path.replace(/\\/g, '/').replace(/^@root\/[^/]+\//, '');
  const direct = decorations.get(normalized);
  if (direct) return direct;

  const segments = normalized.split('/');
  for (let index = segments.length - 1; index > 0; index -= 1) {
    const inherited = decorations.get(segments.slice(0, index).join('/'));
    if (inherited && inheritedStatuses.has(inherited.status)) return inherited;
  }
  return undefined;
}
