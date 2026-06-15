import { toWindowsPath } from './toWindowsPath';

export function getFileNameFromPath(path: string): string {
  const parts = toWindowsPath(path).split('\\');
  return parts[parts.length - 1] || path;
}
