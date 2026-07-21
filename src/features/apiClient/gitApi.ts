import { API } from './apiBase';
import type { GitBlameLineResponse, GitFileDiffResponse, GitFileEntry, GitInlineDiffResponse, GitStatusResponse } from './gitTypes';
import { request } from './request';

export function fetchGitBlameLine(path: string, line: number): Promise<GitBlameLineResponse> {
  return request(`${API}/git/blame-line?${new URLSearchParams({ path, line: String(line) })}`);
}

export function fetchGitFileDiff(path: string, staged: boolean, status: GitFileEntry['status'], root?: string): Promise<GitFileDiffResponse> {
  const params = new URLSearchParams({ path, staged: String(staged), status });
  if (root) params.set('root', root);
  return request(`${API}/git/file-diff?${params}`);
}

export function fetchGitInlineDiff(path: string, staged: boolean, status: GitFileEntry['status'], root?: string): Promise<GitInlineDiffResponse> {
  const params = new URLSearchParams({ path, staged: String(staged), status });
  if (root) params.set('root', root);
  return request(`${API}/git/inline-diff?${params}`);
}

export function fetchGitStatus(root?: string): Promise<GitStatusResponse> {
  return request(`${API}/git/status${root ? `?root=${encodeURIComponent(root)}` : ''}`);
}

export function gitCommit(message: string, amend = false, root?: string): Promise<{ output: string }> {
  return request(`${API}/git/commit`, jsonPost({ message, amend, root }));
}

export async function gitDiscard(paths: string[], root?: string): Promise<void> {
  await request(`${API}/git/discard`, jsonPost({ paths, root }));
}

export function gitPull(root?: string): Promise<{ output: string }> {
  return request(`${API}/git/pull`, jsonPost({ root }));
}

export function gitPush(root?: string): Promise<{ output: string }> {
  return request(`${API}/git/push`, jsonPost({ root }));
}

export function gitResolveConflict(path: string, strategy: 'ours' | 'theirs' | 'resolved', root?: string) {
  return request(`${API}/git/resolve-conflict`, jsonPost({ path, strategy, root }));
}

export async function gitStage(paths?: string[], root?: string): Promise<void> {
  await request(`${API}/git/stage`, jsonPost({ paths: paths || null, root }));
}

export async function gitUnstage(paths?: string[], root?: string): Promise<void> {
  await request(`${API}/git/unstage`, jsonPost({ paths: paths || null, root }));
}

function jsonPost(body: unknown): RequestInit {
  return { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}
