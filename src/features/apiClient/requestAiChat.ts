import { API } from './apiBase';
import type { AiConfig } from '../ai/aiConfig';
import type { AiContext, AiMessage } from './aiTypes';
import { request } from './request';

export async function requestAiChat(config: AiConfig, messages: AiMessage[], context: AiContext): Promise<string> {
  const result = await request(`${API}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config, messages, context }),
  });
  return result.content;
}
