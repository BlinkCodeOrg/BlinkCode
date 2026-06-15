import { escapeHtml } from '../../shared/html/escapeHtml';
import { normalizePreviewUrl } from './normalizePreviewUrl';

export function renderInlineMarkdown(value: string, sourcePath?: string): string {
  return escapeHtml(value)
    .replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_m, alt, src) => {
      const safeSrc = normalizePreviewUrl(src, sourcePath);
      return `<img src="${escapeHtml(safeSrc)}" alt="${escapeHtml(alt)}">`;
    })
    .replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_m, label, href) => {
      const safeHref = normalizePreviewUrl(href, sourcePath);
      return `<a href="${escapeHtml(safeHref)}" target="_blank" rel="noreferrer">${label}</a>`;
    })
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>');
}
