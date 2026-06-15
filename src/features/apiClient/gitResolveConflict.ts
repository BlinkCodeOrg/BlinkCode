import { API } from './apiBase';
import { request } from './request';

export async function gitResolveConflict(path: string, strategy: 'ours' | 'theirs' | 'resolved', root?: string) {
  return request(`${API}/git/resolve-conflict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, strategy, root }),
  });
}
