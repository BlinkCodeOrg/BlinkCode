import type { MonacoModel } from './sessionTypes';

export function modelToFileUri(model: MonacoModel, workspacePath: string): string {
  const raw = model.uri.toString();
  const rawPath = (model.uri.path || '').replace(/^\/+/, '');
  const looksAbsolute = /^[a-zA-Z]:/.test(rawPath) || rawPath.startsWith('/');
  if (raw.startsWith('file://') && looksAbsolute) return raw;
  if (!rawPath || !workspacePath) return raw;

  const base = workspacePath.replace(/\\/g, '/').replace(/\/+$/, '');
  const full = `${base}/${rawPath}`;
  if (/^[a-zA-Z]:/.test(full)) return `file:///${encodeURI(full)}`;
  return `file://${encodeURI(full)}`;
}
