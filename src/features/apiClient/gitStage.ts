import { API } from './apiBase';
import { request } from './request';

export async function gitStage(paths?: string[], root?: string): Promise<void> {
  await request(`${API}/git/stage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paths: paths || null, root }),
  });
}
