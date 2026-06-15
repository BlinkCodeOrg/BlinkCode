import { BINARY_EXTENSIONS } from './binaryExtensions';

export function isBinary(name: string): boolean {
  const lower = name.toLowerCase();
  if (lower.endsWith('.db-shm') || lower.endsWith('.db-wal') || lower.endsWith('.sqlite-shm') || lower.endsWith('.sqlite-wal')) {
    return true;
  }

  const ext = lower.split('.').pop()?.toLowerCase() || '';
  return BINARY_EXTENSIONS.has(ext);
}
