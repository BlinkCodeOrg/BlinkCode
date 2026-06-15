const DEFAULT_LIMIT = 512 * 1024;

export async function fetchRemoteFile(url, {
  fetchImpl = fetch,
  limit = DEFAULT_LIMIT,
  responseType = 'buffer',
} = {}) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'raw.githubusercontent.com') {
    throw new Error('Extension downloads must use raw.githubusercontent.com over HTTPS');
  }

  const response = await fetchImpl(parsed, {
    headers: { 'user-agent': 'BlinkCode-extension-marketplace' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Extension download failed with HTTP ${response.status}`);

  const declaredLength = Number(response.headers.get('content-length') || 0);
  if (declaredLength > limit) throw new Error('Extension download is too large');
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength > limit) throw new Error('Extension download is too large');
  return responseType === 'json' ? JSON.parse(buffer.toString('utf8')) : buffer;
}
