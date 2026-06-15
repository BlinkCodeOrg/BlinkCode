import { API } from './apiBase';
import { request } from './request';

export async function addWorkspaceRoot(dirPath: string): Promise<void> {
  await request(`${API}/workspace/roots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dirPath }),
  });
}
