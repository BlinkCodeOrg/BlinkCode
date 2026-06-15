import { escapeHtml } from '../../shared/html/escapeHtml';

export function highlightedPreview(preview: string, column: number, length: number): string {
  const start = Math.max(0, column - 1);
  const end = Math.min(preview.length, start + length);
  return `${escapeHtml(preview.slice(0, start))}<mark>${escapeHtml(preview.slice(start, end))}</mark>${escapeHtml(preview.slice(end))}`;
}
