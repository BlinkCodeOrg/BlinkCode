import { request } from '../apiClient/request';

export async function fetchQuickOpenFiles(): Promise<string[]> {
  const data = await request('/api/files');
  return data.files || [];
}
