import { API } from './apiBase';
import { request } from './request';

export async function renameOnServer(oldPath: string, newName: string): Promise<{ newPath: string }> {
  const data = await request(`${API}/rename`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldPath, newName }),
  });
  return { newPath: data.newPath };
}
