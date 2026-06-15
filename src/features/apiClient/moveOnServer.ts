import { API } from './apiBase';
import { request } from './request';

export async function moveOnServer(sourcePath: string, targetPath: string | null, position: string): Promise<{ newPath: string }> {
  const data = await request(`${API}/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourcePath, targetPath, position }),
  });
  return { newPath: data.newPath };
}
