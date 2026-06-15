import { API } from './apiBase';
import { request } from './request';

export async function createFileOnServer(serverPath: string, type: 'file' | 'folder'): Promise<void> {
  await request(`${API}/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filePath: serverPath, type }),
  });
}
