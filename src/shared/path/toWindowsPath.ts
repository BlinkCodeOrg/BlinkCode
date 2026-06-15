export function toWindowsPath(path: string): string {
  return path.replace(/\//g, '\\');
}
