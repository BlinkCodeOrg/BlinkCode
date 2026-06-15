import { normalizeAiBaseUrl } from './normalizeAiBaseUrl.js';

export async function checkAiProvider(config) {
  const baseUrl = normalizeAiBaseUrl(config?.baseUrl || process.env.BLINKCODE_AI_BASE_URL || 'http://127.0.0.1:11434/v1');
  let url;
  try {
    url = new URL(`${baseUrl}/models`);
  } catch {
    return { connected: false, error: 'Enter a valid OpenAI-compatible provider URL.' };
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    return { connected: false, error: 'AI provider must use HTTP or HTTPS.' };
  }
  const apiKey = String(config?.apiKey || process.env.BLINKCODE_AI_API_KEY || '');
  try {
    const response = await fetch(url, {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      signal: AbortSignal.timeout(4_000),
    });
    const raw = await response.text();
    let data = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      return {
        connected: false,
        error: looksLikeHtml(raw)
          ? `The URL ${baseUrl} returned a web page instead of an AI API. Use an OpenAI-compatible /v1 endpoint.`
          : `The provider at ${baseUrl} returned invalid JSON.`,
      };
    }
    if (!response.ok) {
      return {
        connected: false,
        error: data?.error?.message || data?.message || `Provider returned HTTP ${response.status}.`,
      };
    }
    const models = Array.isArray(data?.data)
      ? data.data.map(model => String(model.id || '')).filter(Boolean)
      : [];
    return { connected: true, models };
  } catch (error) {
    if (error?.name === 'TimeoutError') {
      return { connected: false, error: `Provider at ${baseUrl} did not respond within 4 seconds.` };
    }
    return {
      connected: false,
      error: `Cannot reach ${baseUrl}. Start the local provider or update the URL and API key.`,
    };
  }
}

function looksLikeHtml(value) {
  return /^\s*(?:<!doctype\s+html|<html|<head|<body)/i.test(String(value || ''));
}
