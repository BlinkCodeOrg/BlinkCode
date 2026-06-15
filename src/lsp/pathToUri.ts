export function pathToUri(path: string): string {
  if (!path) return '';
  const norm = path.replace(/\\/g, '/');
  if (/^[a-zA-Z]:/.test(norm)) return `file:///${encodeURI(norm)}`;
  if (norm.startsWith('/')) return `file://${encodeURI(norm)}`;
  return `file:///${encodeURI(norm)}`;
}
