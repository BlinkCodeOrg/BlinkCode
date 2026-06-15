import { API } from './apiBase';
import type { AiConfig } from '../ai/aiConfig';
import { request } from './request';

export async function requestAiCompletion(config: AiConfig, input: {
  prefix: string;
  suffix: string;
  filePath: string;
  language: string;
}, signal?: AbortSignal): Promise<string> {
  const result = await request(`${API}/ai/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config, ...input }),
    signal,
  });
  return result.completion || '';
}
