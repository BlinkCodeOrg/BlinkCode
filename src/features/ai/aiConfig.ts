export interface AiConfig {
  baseUrl: string;
  model: string;
  apiKey: string;
}

const STORAGE_KEY = 'blinkcode-ai-config';

export function loadAiConfig(): AiConfig {
  try {
    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
    return {
      baseUrl: stored.baseUrl || 'http://127.0.0.1:11434/v1',
      model: stored.model || 'qwen2.5-coder:7b',
      apiKey: stored.apiKey || '',
    };
  } catch {
    return { baseUrl: 'http://127.0.0.1:11434/v1', model: 'qwen2.5-coder:7b', apiKey: '' };
  }
}

export function saveAiConfig(config: AiConfig) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...config, apiKey: window.electronAPI?.setSecret ? '' : config.apiKey }));
  if (window.electronAPI?.setSecret) {
    if (config.apiKey) void window.electronAPI.setSecret('ai.apiKey', config.apiKey);
    else void window.electronAPI.deleteSecret?.('ai.apiKey');
  }
  window.dispatchEvent(new CustomEvent('blinkcode:aiConfigChanged'));
}

export async function loadSecureAiApiKey(): Promise<string> {
  return window.electronAPI?.getSecret?.('ai.apiKey') || '';
}
