import { API } from './apiBase';
import type { DebugVariable } from './debuggerTypes';
import { request } from './request';

export async function evaluateDebugExpression(expression: string, callFrameId = ''): Promise<DebugVariable> {
  const response = await request(`${API}/debug/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expression, callFrameId }),
  });
  return response.result;
}
