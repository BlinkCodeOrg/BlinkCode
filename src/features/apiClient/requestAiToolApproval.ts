import { API } from './apiBase';
import { request } from './request';
import type { AiToolCall } from './aiTypes';

export async function requestAiToolApproval(tool: AiToolCall): Promise<string> {
  const response = await request(`${API}/ai/tools/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool }),
  });
  return response.approvalToken;
}
