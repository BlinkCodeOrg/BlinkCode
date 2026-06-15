import { API } from './apiBase';
import type { DebugConfigurationsResponse } from './debuggerTypes';
import { request } from './request';

export function fetchDebugConfigurations(): Promise<DebugConfigurationsResponse> {
  return request(`${API}/debug/configurations`);
}
