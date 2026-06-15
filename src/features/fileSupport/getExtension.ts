import { normalizeFileName } from './normalizeFileName';

export function getExtension(fileName: string): string {
  const normalized = normalizeFileName(fileName);
  if (!normalized || !normalized.includes('.') || normalized.startsWith('.')) return '';
  return normalized.split('.').pop() || '';
}
