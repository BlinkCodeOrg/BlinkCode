import { API } from './apiBase';
import type { AiConfig } from '../ai/aiConfig';
import { request } from './request';

export interface AiProviderStatus {
  connected: boolean;
  models?: string[];
  error?: string;
}

export function fetchAiProviderStatus(config: AiConfig): Promise<AiProviderStatus> {
  return request(`${API}/ai/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config }),
  });
}
