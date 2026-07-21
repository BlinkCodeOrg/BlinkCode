import type { AiConfig } from '../ai/aiConfig';
import { API } from './apiBase';
import type { AiContext, AiMessage, AiToolCall } from './aiTypes';
import { request } from './request';

export interface AiProviderStatus {
  connected: boolean;
  models?: string[];
  error?: string;
}

export async function executeAiTool(tool: AiToolCall, approvalToken = ''): Promise<unknown> {
  const response = await request(`${API}/ai/tools/execute`, jsonPost({ tool, approvalToken }));
  return response.result;
}

export function fetchAiProviderStatus(config: AiConfig): Promise<AiProviderStatus> {
  return request(`${API}/ai/status`, jsonPost({ config }));
}

export async function requestAiAgentPlan(config: AiConfig, prompt: string, context: AiContext): Promise<AiToolCall[]> {
  const result = await request(`${API}/ai/agent/plan`, jsonPost({ config, prompt, context }));
  return result.tools || [];
}

export async function requestAiChat(config: AiConfig, messages: AiMessage[], context: AiContext): Promise<string> {
  const result = await request(`${API}/ai/chat`, jsonPost({ config, messages, context }));
  return result.content;
}

export async function requestAiCompletion(config: AiConfig, input: {
  prefix: string;
  suffix: string;
  filePath: string;
  language: string;
}, signal?: AbortSignal): Promise<string> {
  const result = await request(`${API}/ai/complete`, { ...jsonPost({ config, ...input }), signal });
  return result.completion || '';
}

export async function requestAiToolApproval(tool: AiToolCall): Promise<string> {
  const response = await request(`${API}/ai/tools/preview`, jsonPost({ tool }));
  return response.approvalToken;
}

function jsonPost(body: unknown): RequestInit {
  return { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}
