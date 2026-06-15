import type { EditorSettings } from '../../types';
import { API } from './apiBase';
import { request } from './request';

export async function saveSettingsToServer(
  settings: Partial<EditorSettings>,
  scope: 'global' | 'workspace' = 'global',
): Promise<void> {
  await request(`${API}/settings?scope=${scope}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
}
