import { API } from './apiBase';
import type { DebugBreakpoint, DebugConfiguration, DebugConfigurationsResponse, DebugSessionState, DebugVariable } from './debuggerTypes';
import { request } from './request';

export type DebugCommand = 'continue' | 'pause' | 'stepOver' | 'stepInto' | 'stepOut' | 'restart' | 'stop';

export function attachDebugSession(endpoint: string, breakpoints: DebugBreakpoint[] = []): Promise<DebugSessionState> {
  return request(`${API}/debug/attach`, jsonPost({ endpoint, breakpoints }));
}

export function clearDebugOutput(): Promise<DebugSessionState> {
  return request(`${API}/debug/output`, { method: 'DELETE' });
}

export function createDebugConfiguration(activeFile = ''): Promise<DebugConfigurationsResponse> {
  return request(`${API}/debug/configurations`, jsonPost({ activeFile }));
}

export async function evaluateDebugExpression(expression: string, callFrameId = ''): Promise<DebugVariable> {
  const response = await request(`${API}/debug/evaluate`, jsonPost({ expression, callFrameId }));
  return response.result;
}

export function fetchDebugConfigurations(): Promise<DebugConfigurationsResponse> {
  return request(`${API}/debug/configurations`);
}

export function fetchDebugStatus(): Promise<DebugSessionState> {
  return request(`${API}/debug/status`);
}

export async function fetchDebugVariables(objectId: string): Promise<DebugVariable[]> {
  const response = await request(`${API}/debug/variables?objectId=${encodeURIComponent(objectId)}`);
  return Array.isArray(response.variables) ? response.variables : [];
}

export function sendDebugCommand(command: DebugCommand): Promise<DebugSessionState> {
  return request(`${API}/debug/command`, jsonPost({ command }));
}

export function startDebugSession(filePath: string, breakpoints: DebugBreakpoint[], configuration?: DebugConfiguration): Promise<DebugSessionState> {
  return request(`${API}/debug/start`, jsonPost({ filePath, breakpoints, configuration }));
}

function jsonPost(body: unknown): RequestInit {
  return { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}
