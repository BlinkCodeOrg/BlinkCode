import { API } from './apiBase';
import type { DebugSessionState } from './debuggerTypes';
import { request } from './request';

export function clearDebugOutput(): Promise<DebugSessionState> {
  return request(`${API}/debug/output`, { method: 'DELETE' });
}
