import { API } from './apiBase';
import type { GitBlameLineResponse } from './gitTypes';
import { request } from './request';

export async function fetchGitBlameLine(path: string, line: number): Promise<GitBlameLineResponse> {
  const params = new URLSearchParams({ path, line: String(line) });
  return request(`${API}/git/blame-line?${params.toString()}`);
}
