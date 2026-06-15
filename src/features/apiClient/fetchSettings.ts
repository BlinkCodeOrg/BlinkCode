import { API } from './apiBase';
import { request } from './request';
import type { SettingsResponse } from './settingsTypes';

export async function fetchSettings(): Promise<SettingsResponse> {
  return request(`${API}/settings`);
}
