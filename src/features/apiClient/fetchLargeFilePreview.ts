import { API } from './apiBase';
import { request } from './request';

export type LargeFilePreviewChunk = {
  content: string;
  offset: number;
  size: number;
  done: boolean;
};

export function fetchLargeFilePreview(serverPath: string, offset = 0): Promise<LargeFilePreviewChunk> {
  const params = new URLSearchParams({ path: serverPath, offset: String(offset) });
  return request(`${API}/file-preview?${params.toString()}`);
}
