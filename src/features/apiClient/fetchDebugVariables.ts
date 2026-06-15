import { API } from './apiBase';
import { request } from './request';
import type { DebugVariable } from './debuggerTypes';

export async function fetchDebugVariables(objectId: string): Promise<DebugVariable[]> {
  const response = await request(`${API}/debug/variables?objectId=${encodeURIComponent(objectId)}`);
  return Array.isArray(response.variables) ? response.variables : [];
}
