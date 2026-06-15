import type { AlignedDiffLine, DiffHunk } from './diffPreviewTypes';

export function alignByHunks(
  originalLines: string[],
  modifiedLines: string[],
  hunks: DiffHunk[] | undefined,
): AlignedDiffLine[] {
  const out: AlignedDiffLine[] = [];
  const hs = [...(hunks || [])].sort((a, b) => (a.oldStart || 0) - (b.oldStart || 0));

  let oldPos = 1;
  let newPos = 1;

  const pushUnchanged = (count: number) => {
    for (let i = 0; i < count; i += 1) {
      out.push({ left: originalLines[oldPos - 1] ?? '', right: modifiedLines[newPos - 1] ?? '', kind: '' });
      oldPos += 1;
      newPos += 1;
    }
  };

  for (const h of hs) {
    const unchanged = Math.max(0, Math.min(h.oldStart - oldPos, h.newStart - newPos));
    pushUnchanged(unchanged);

    if (h.type === 'added') {
      for (let i = 0; i < Math.max(1, h.newLines); i += 1) {
        out.push({ left: '', right: modifiedLines[newPos - 1] ?? '', kind: 'added' });
        newPos += 1;
      }
      continue;
    }

    if (h.type === 'deleted') {
      for (let i = 0; i < Math.max(1, h.oldLines); i += 1) {
        out.push({ left: originalLines[oldPos - 1] ?? '', right: '', kind: 'removed' });
        oldPos += 1;
      }
      continue;
    }

    const span = Math.max(Math.max(1, h.newLines), Math.max(1, h.oldLines));
    for (let i = 0; i < span; i += 1) {
      out.push({
        left: originalLines[oldPos - 1] ?? '',
        right: modifiedLines[newPos - 1] ?? '',
        kind: 'modified',
      });
      if (i < h.oldLines) oldPos += 1;
      if (i < h.newLines) newPos += 1;
    }
  }

  while (oldPos <= originalLines.length || newPos <= modifiedLines.length) {
    out.push({ left: originalLines[oldPos - 1] ?? '', right: modifiedLines[newPos - 1] ?? '', kind: '' });
    oldPos += 1;
    newPos += 1;
  }

  return out;
}
