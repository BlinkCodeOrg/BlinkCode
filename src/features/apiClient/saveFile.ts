import { API } from './apiBase';
import { request } from './request';

export async function saveFile(serverPath: string, content: string): Promise<void> {
  await request(`${API}/file`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filePath: serverPath, content }),
  });
}
