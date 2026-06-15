import { API } from './apiBase';
import { request } from './request';

export async function gitPush(root?: string): Promise<{ output: string }> {
  return request(`${API}/git/push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ root }),
  });
}
