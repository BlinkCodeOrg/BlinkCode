import { API } from './apiBase';
import { request } from './request';

export async function fetchSettingsRaw(
  scope: 'global' | 'workspace' = 'global',
): Promise<{ content: string; path: string }> {
  return request(`${API}/settings/raw?scope=${scope}`);
}
