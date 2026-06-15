import { API } from './apiBase';
import type { RestClientHistoryEntry } from './restClientTypes';
import { request } from './request';

export async function fetchRestClientHistory(): Promise<RestClientHistoryEntry[]> {
  const result = await request(`${API}/rest-client/history`);
  return result.history || [];
}
