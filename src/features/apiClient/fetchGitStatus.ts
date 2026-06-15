import { API } from './apiBase';
import { request } from './request';
import type { GitStatusResponse } from './gitTypes';

export async function fetchGitStatus(root?: string): Promise<GitStatusResponse> {
  const params = root ? `?root=${encodeURIComponent(root)}` : '';
  return request(`${API}/git/status${params}`);
}
