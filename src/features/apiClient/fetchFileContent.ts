import { API } from './apiBase';
import { request } from './request';

export async function fetchFileContent(serverPath: string, binary?: boolean): Promise<string> {
  if (binary) return '';
  const data = await request(`${API}/file?path=${encodeURIComponent(serverPath)}`);
  return data.content || '';
}
