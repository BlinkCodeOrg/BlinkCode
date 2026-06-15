import { API } from './apiBase';
import { request } from './request';

export async function gitPull(root?: string): Promise<{ output: string }> {
  return request(`${API}/git/pull`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ root }),
  });
}
