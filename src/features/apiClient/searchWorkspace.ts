import { API } from './apiBase';
import { request } from './request';
import type { WorkspaceSearchOptions, WorkspaceSearchResponse } from './workspaceSearchTypes';

export async function searchWorkspace(options: WorkspaceSearchOptions): Promise<WorkspaceSearchResponse> {
  return request(`${API}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });
}
