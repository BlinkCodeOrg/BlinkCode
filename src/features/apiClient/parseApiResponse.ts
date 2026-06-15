export function parseApiResponse(raw: string, contentType: string | null): unknown {
  if (!raw) return {};
  const normalized = raw.trimStart();
  if (/^<(?:!doctype|html)\b/i.test(normalized)) {
    throw new Error('BlinkCode backend returned the app page instead of API data. Restart the backend and reload BlinkCode.');
  }
  if (!contentType?.toLowerCase().includes('application/json')) {
    throw new Error(`BlinkCode backend returned an unsupported response type: ${contentType || 'unknown'}.`);
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('BlinkCode backend returned malformed JSON. Restart the backend and try again.');
  }
}
