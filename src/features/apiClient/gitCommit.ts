import { API } from './apiBase';
import { request } from './request';

export async function gitCommit(message: string, amend = false, root?: string): Promise<{ output: string }> {
  return request(`${API}/git/commit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, amend, root }),
  });
}
