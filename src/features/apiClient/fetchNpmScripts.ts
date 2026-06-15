import { API } from './apiBase';
import { request } from './request';
import type { NpmScriptPackage } from './npmScriptTypes';

export async function fetchNpmScripts(): Promise<NpmScriptPackage[]> {
  const data = await request(`${API}/npm-scripts`);
  return Array.isArray(data.packages) ? data.packages : [];
}
