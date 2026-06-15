import { getRawFileUrl } from '../../utils/api';

export function normalizePreviewUrl(rawUrl: string, sourcePath?: string): string {
  const clean = rawUrl.trim();
  if (!clean || clean.startsWith('#') || /^(https?:|mailto:|data:)/i.test(clean)) return clean;
  if (clean.startsWith('/')) return clean;
  const baseDir = sourcePath?.includes('/') ? sourcePath.slice(0, sourcePath.lastIndexOf('/')) : '';
  const joined = `${baseDir ? `${baseDir}/` : ''}${clean}`.replace(/\\/g, '/');
  const parts: string[] = [];
  for (const part of joined.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') parts.pop();
    else parts.push(part);
  }
  return getRawFileUrl(parts.join('/'));
}
