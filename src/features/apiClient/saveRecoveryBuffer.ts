import { API } from './apiBase';
import { request } from './request';

export async function saveRecoveryBuffer(filePath: string, content: string): Promise<void> {
  await request(`${API}/recovery`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filePath, content }),
  });
}
