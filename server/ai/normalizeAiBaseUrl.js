export function normalizeAiBaseUrl(value) {
  const raw = String(value || '').trim().replace(/\/+$/, '');
  if (!raw) return '';
  let url;
  try {
    url = new URL(raw);
  } catch {
    return raw;
  }
  const path = url.pathname.replace(/\/+$/, '');
  if (!path || path === '/') url.pathname = '/v1';
  return url.toString().replace(/\/+$/, '');
}
