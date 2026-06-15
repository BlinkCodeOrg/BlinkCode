import { API } from './apiBase';
import { request } from './request';

export async function deleteOnServer(serverPath: string): Promise<void> {
  await request(`${API}/delete?path=${encodeURIComponent(serverPath)}`, { method: 'DELETE' });
}
