import { API } from './apiBase';
import type { GitFileDiffResponse, GitFileEntry } from './gitTypes';
import { request } from './request';

export async function fetchGitFileDiff(path: string, staged: boolean, status: GitFileEntry['status'], root?: string): Promise<GitFileDiffResponse> {
  const params = new URLSearchParams({ path, staged: String(staged), status });
  if (root) params.set('root', root);
  return request(`${API}/git/file-diff?${params.toString()}`);
}
