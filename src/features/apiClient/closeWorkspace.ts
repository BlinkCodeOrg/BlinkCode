import { API } from './apiBase';
import { request } from './request';

export async function closeWorkspace(): Promise<void> {
  await request(`${API}/close-workspace`, { method: 'POST' });
}
