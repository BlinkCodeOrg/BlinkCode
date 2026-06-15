import { normalizeAiBaseUrl } from './normalizeAiBaseUrl.js';

export async function requestAiCompletion(config, messages, options = {}) {
  const baseUrl = normalizeAiBaseUrl(config?.baseUrl || process.env.BLINKCODE_AI_BASE_URL || 'http://127.0.0.1:11434/v1');
  const url = new URL(`${baseUrl}/chat/completions`);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('AI provider must use HTTP or HTTPS');
  const model = String(config?.model || process.env.BLINKCODE_AI_MODEL || 'qwen2.5-coder:7b');
  const apiKey = String(config?.apiKey || process.env.BLINKCODE_AI_API_KEY || '');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs || 60_000);
  try {
    let response;
    try {
      response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.2,
        max_tokens: options.maxTokens ?? 1200,
        stream: false,
      }),
      signal: controller.signal,
      });
    } catch (error) {
      if (error?.name === 'AbortError') throw error;
      throw new Error(`Cannot reach AI provider at ${baseUrl}. Check Provider settings and make sure the model server is running.`);
    }
    const raw = await response.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      if (/^\s*(?:<!doctype\s+html|<html|<head|<body)/i.test(raw)) {
        throw new Error(`AI Provider URL points to a web page, not an API. Use an OpenAI-compatible endpoint ending in /v1, for example http://127.0.0.1:11434/v1.`);
      }
      throw new Error(`AI provider returned invalid JSON: ${raw.slice(0, 160)}`);
    }
    if (!response.ok) throw new Error(data?.error?.message || data?.message || `AI provider error: HTTP ${response.status}`);
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') throw new Error('AI provider returned no completion');
    return { content, model: data.model || model };
  } finally {
    clearTimeout(timer);
  }
}
