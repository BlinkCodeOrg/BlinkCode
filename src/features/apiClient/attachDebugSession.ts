import { API } from './apiBase';
import type { DebugBreakpoint, DebugSessionState } from './debuggerTypes';
import { request } from './request';

export function attachDebugSession(endpoint: string, breakpoints: DebugBreakpoint[] = []): Promise<DebugSessionState> {
  return request(`${API}/debug/attach`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint, breakpoints }),
  });
}
