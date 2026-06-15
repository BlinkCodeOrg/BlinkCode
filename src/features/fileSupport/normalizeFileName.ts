export function normalizeFileName(fileName: string): string {
  return fileName.trim().split('/').pop()?.split('\\').pop()?.toLowerCase() || '';
}
