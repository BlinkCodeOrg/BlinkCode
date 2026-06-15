import { API } from './apiBase';
import type { DebugConfigurationsResponse } from './debuggerTypes';
import { request } from './request';

export function createDebugConfiguration(activeFile = ''): Promise<DebugConfigurationsResponse> {
  return request(`${API}/debug/configurations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ activeFile }),
  });
}
