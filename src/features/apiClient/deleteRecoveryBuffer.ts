import { API } from './apiBase';
import { request } from './request';

export async function deleteRecoveryBuffer(filePath: string): Promise<void> {
  await request(`${API}/recovery?path=${encodeURIComponent(filePath)}`, {
    method: 'DELETE',
  });
}
