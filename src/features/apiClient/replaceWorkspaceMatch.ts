import { API } from './apiBase';
import { request } from './request';

export async function replaceWorkspaceMatch(input: {
  path: string;
  line: number;
  column: number;
  length: number;
  expected: string;
  replacement: string;
}): Promise<void> {
  await request(`${API}/search/replace-match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}
