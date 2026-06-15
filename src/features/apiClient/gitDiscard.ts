import { API } from './apiBase';
import { request } from './request';

export async function gitDiscard(paths: string[], root?: string): Promise<void> {
  await request(`${API}/git/discard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paths, root }),
  });
}
