export function buildLspUrl(serverKey: string): string {
  const loc = window.location;
  const host = loc.hostname;
  const port = loc.port === '5173' || loc.port === '5174' ? '3001' : loc.port;
  const proto = loc.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${host}:${port}/ws/lsp/${serverKey}`;
}
