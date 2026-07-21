import { API } from './apiBase';
import type { WorkspaceSearchFileResult, WorkspaceSearchOptions, WorkspaceSearchResponse } from './workspaceSearchTypes';
import { authenticatedFetch } from './apiSession';

export async function searchWorkspaceStream(
  options: WorkspaceSearchOptions,
  onFile: (file: WorkspaceSearchFileResult) => void,
): Promise<WorkspaceSearchResponse> {
  const response = await authenticatedFetch(`${API}/search/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });
  if (!response.ok || !response.body) throw new Error(`Search failed (${response.status})`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let complete: WorkspaceSearchResponse = { results: [], totalMatches: 0, truncated: false };
  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line) continue;
      const event = JSON.parse(line);
      if (event.type === 'file') onFile(event.file);
      if (event.type === 'error') throw new Error(event.error);
      if (event.type === 'complete') {
        complete = {
          results: [],
          totalMatches: event.totalMatches,
          truncated: event.truncated,
          engine: event.engine,
        };
      }
    }
    if (done) break;
  }
  return complete;
}
