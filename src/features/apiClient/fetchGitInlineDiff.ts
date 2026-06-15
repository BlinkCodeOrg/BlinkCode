import { API } from './apiBase';
import type { GitFileEntry, GitInlineDiffResponse } from './gitTypes';
import { request } from './request';

export async function fetchGitInlineDiff(path: string, staged: boolean, status: GitFileEntry['status'], root?: string): Promise<GitInlineDiffResponse> {
  const params = new URLSearchParams({ path, staged: String(staged), status });
  if (root) params.set('root', root);
  return request(`${API}/git/inline-diff?${params.toString()}`);
}
