import { escapeHtml } from '../../shared/html/escapeHtml';
import { normalizePreviewUrl } from './normalizePreviewUrl';

export function sanitizeLimitedHtml(value: string, sourcePath?: string): string {
  let html = value
    .replace(/<\/?(script|style|iframe|object|embed|link|meta)[^>]*>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/\s(href|src)=["']javascript:[^"']*["']/gi, '');

  html = html.replace(/<img\b([^>]*)>/gi, (_match, attrs) => {
    const src = String(attrs).match(/\ssrc=["']([^"']+)["']/i)?.[1] || '';
    const alt = String(attrs).match(/\salt=["']([^"']*)["']/i)?.[1] || '';
    const width = String(attrs).match(/\swidth=["']([^"']+)["']/i)?.[1] || '';
    const safeSrc = normalizePreviewUrl(src, sourcePath);
    const widthAttr = /^\d+%?$/.test(width) ? ` width="${escapeHtml(width)}"` : '';
    return `<img src="${escapeHtml(safeSrc)}" alt="${escapeHtml(alt)}"${widthAttr}>`;
  });

  html = html.replace(/<a\b([^>]*)>/gi, (_match, attrs) => {
    const href = String(attrs).match(/\shref=["']([^"']+)["']/i)?.[1] || '';
    const safeHref = normalizePreviewUrl(href, sourcePath);
    return `<a href="${escapeHtml(safeHref)}" target="_blank" rel="noreferrer">`;
  });

  html = html.replace(/<(p|h1|h2|h3)\b([^>]*)>/gi, (_match, tag, attrs) => {
    const align = String(attrs).match(/\salign=["'](left|center|right)["']/i)?.[1]?.toLowerCase();
    return align ? `<${tag} align="${align}">` : `<${tag}>`;
  });

  return html;
}
