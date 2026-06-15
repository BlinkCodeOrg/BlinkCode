import { API } from './apiBase';
import { request } from './request';

export async function saveSettingsRaw(
  content: string,
  scope: 'global' | 'workspace' = 'global',
): Promise<void> {
  await request(`${API}/settings/raw?scope=${scope}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
}
