import { API } from './apiBase';
import { request } from './request';
import type { DebugSessionState } from './debuggerTypes';

export function fetchDebugStatus(): Promise<DebugSessionState> {
  return request(`${API}/debug/status`);
}
