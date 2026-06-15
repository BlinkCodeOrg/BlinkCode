import { API } from './apiBase';
import { request } from './request';
import type { DebugBreakpoint, DebugConfiguration, DebugSessionState } from './debuggerTypes';

export function startDebugSession(
  filePath: string,
  breakpoints: DebugBreakpoint[],
  configuration?: DebugConfiguration,
): Promise<DebugSessionState> {
  return request(`${API}/debug/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filePath, breakpoints, configuration }),
  });
}
