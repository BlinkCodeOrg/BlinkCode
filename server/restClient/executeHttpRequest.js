const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;

export async function executeHttpRequest(request) {
  const url = new URL(request.url);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only HTTP and HTTPS requests are supported');
  if (url.username || url.password) throw new Error('Credentials in request URLs are not allowed');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  const startedAt = Date.now();
  try {
    const response = await fetch(url, {
      method: request.method,
      headers: request.headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
      redirect: 'follow',
      signal: controller.signal,
    });
    const bytes = new Uint8Array(await response.arrayBuffer());
    const truncated = bytes.byteLength > MAX_RESPONSE_BYTES;
    const body = new TextDecoder().decode(bytes.slice(0, MAX_RESPONSE_BYTES));
    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body,
      truncated,
      durationMs: Date.now() - startedAt,
      size: bytes.byteLength,
    };
  } finally {
    clearTimeout(timer);
  }
}
