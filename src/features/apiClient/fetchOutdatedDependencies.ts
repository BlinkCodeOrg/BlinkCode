import { API } from './apiBase';
import { request } from './request';
import type { OutdatedDependenciesResponse } from './dependencyTypes';

export async function fetchOutdatedDependencies(directory: string): Promise<OutdatedDependenciesResponse> {
  const data = await request(`${API}/dependencies/outdated?directory=${encodeURIComponent(directory)}`);
  return {
    outdated: Array.isArray(data.outdated) ? data.outdated : [],
    warnings: Array.isArray(data.warnings) ? data.warnings : [],
  };
}
