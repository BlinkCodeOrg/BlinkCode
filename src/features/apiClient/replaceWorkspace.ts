import { API } from './apiBase';
import { request } from './request';
import type { WorkspaceSearchOptions } from './workspaceSearchTypes';

export async function replaceWorkspace(options: WorkspaceSearchOptions): Promise<{ changedFiles: Array<{ path: string; replacements: number }>; totalReplacements: number }> {
  return request(`${API}/search/replace`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });
}
