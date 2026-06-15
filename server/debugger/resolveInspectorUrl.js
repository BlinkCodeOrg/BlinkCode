export async function resolveInspectorUrl(endpoint) {
  const value = String(endpoint || '').trim();
  if (!value) throw new Error('Inspector endpoint is required');
  if (value.startsWith('ws://') || value.startsWith('wss://')) return value;

  const base = /^https?:\/\//i.test(value) ? value : `http://${value}`;
  let response;
  try {
    response = await fetch(new URL('/json/list', base), { signal: AbortSignal.timeout(4_000) });
  } catch (error) {
    if (error?.name === 'TimeoutError') throw new Error(`Inspector at ${value} did not respond within 4 seconds`);
    throw new Error(`Cannot reach Inspector at ${value}. Start Node with --inspect or Chrome with --remote-debugging-port.`);
  }
  if (!response.ok) throw new Error(`Inspector discovery failed: HTTP ${response.status}`);
  const targets = await response.json();
  const target = targets.find(item => item.type === 'page') || targets[0];
  if (!target?.webSocketDebuggerUrl) throw new Error('No debuggable target found');
  return target.webSocketDebuggerUrl;
}
