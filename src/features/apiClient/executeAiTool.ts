import { API } from './apiBase';
import type { AiToolCall } from './aiTypes';
import { request } from './request';

export async function executeAiTool(tool: AiToolCall, approvalToken = ''): Promise<unknown> {
  const response = await request(`${API}/ai/tools/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool, approvalToken }),
  });
  return response.result;
}
