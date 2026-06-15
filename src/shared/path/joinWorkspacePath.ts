import { toWindowsPath } from './toWindowsPath';

export function joinWorkspacePath(workspaceDir: string, serverPath: string): string {
  const relativePath = toWindowsPath(serverPath);
  if (!workspaceDir) return relativePath;
  return `${toWindowsPath(workspaceDir).replace(/\\$/, '')}\\${relativePath}`;
}
