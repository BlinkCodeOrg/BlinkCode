import { API } from './apiBase';
import { request } from './request';

export async function fetchRecentProjects(): Promise<Array<{ path: string; name: string }>> {
  const data = await request(`${API}/recent-projects`);
  return Array.isArray(data.projects) ? data.projects : [];
}
