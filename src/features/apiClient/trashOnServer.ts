import { API } from './apiBase';
import { request } from './request';

function joinWorkspacePath(workspaceDir: string, serverPath: string) {
  const separator = workspaceDir.includes('\\') ? '\\' : '/';
  return `${workspaceDir.replace(/[\\/]+$/, '')}${separator}${serverPath.replace(/\//g, separator)}`;
}

export async function trashOnServer(serverPath: string, workspaceDir: string): Promise<void> {
  if (workspaceDir && window.electronAPI?.trashItem) {
    const moved = await window.electronAPI.trashItem(joinWorkspacePath(workspaceDir, serverPath));
    if (moved) return;
  }

  await request(`${API}/trash`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filePath: serverPath }),
  });
}
