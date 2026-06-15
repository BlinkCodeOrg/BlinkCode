import { API } from './apiBase';
import { request } from './request';
import type { DebugSessionState } from './debuggerTypes';

export type DebugCommand = 'continue' | 'pause' | 'stepOver' | 'stepInto' | 'stepOut' | 'restart' | 'stop';

export function sendDebugCommand(command: DebugCommand): Promise<DebugSessionState> {
  return request(`${API}/debug/command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command }),
  });
}
