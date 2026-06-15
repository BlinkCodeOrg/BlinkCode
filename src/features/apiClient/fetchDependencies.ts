import { API } from './apiBase';
import { request } from './request';
import type { DependencyPackage } from './dependencyTypes';

export async function fetchDependencies(): Promise<DependencyPackage[]> {
  const data = await request(`${API}/dependencies`);
  return Array.isArray(data.packages) ? data.packages : [];
}
