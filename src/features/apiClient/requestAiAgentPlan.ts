import { API } from './apiBase';
import type { AiConfig } from '../ai/aiConfig';
import type { AiContext, AiToolCall } from './aiTypes';
import { request } from './request';

export async function requestAiAgentPlan(config: AiConfig, prompt: string, context: AiContext): Promise<AiToolCall[]> {
  const result = await request(`${API}/ai/agent/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config, prompt, context }),
  });
  return result.tools || [];
}
