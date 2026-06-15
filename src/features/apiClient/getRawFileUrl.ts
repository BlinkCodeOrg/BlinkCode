import { API } from './apiBase';

export function getRawFileUrl(serverPath: string): string {
  return `${API}/raw?path=${encodeURIComponent(serverPath)}`;
}
