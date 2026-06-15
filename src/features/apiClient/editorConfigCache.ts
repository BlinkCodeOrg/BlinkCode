import type { EditorConfigProperties } from './fetchEditorConfig';
import { fetchEditorConfig } from './fetchEditorConfig';

const cache = new Map<string, Promise<EditorConfigProperties>>();

export function fetchEditorConfigCached(serverPath: string): Promise<EditorConfigProperties> {
  const existing = cache.get(serverPath);
  if (existing) return existing;
  const request = fetchEditorConfig(serverPath).catch(error => {
    cache.delete(serverPath);
    throw error;
  });
  cache.set(serverPath, request);
  return request;
}

export function clearEditorConfigCache() {
  cache.clear();
}
