import { API } from './apiBase';

let sessionToken = '';
let pendingSession: Promise<string> | null = null;

export function clearApiSession(): void {
  sessionToken = '';
  pendingSession = null;
}

export function getApiSessionAuthorization(): string | null {
  return sessionToken ? `Bearer ${sessionToken}` : null;
}

export async function ensureApiSession(): Promise<string> {
  if (sessionToken) return sessionToken;
  if (pendingSession) return pendingSession;

  pendingSession = fetch(`${API}/session`, {
    method: 'POST',
    cache: 'no-store',
    credentials: 'same-origin',
  }).then(async response => {
    if (!response.ok) throw new Error(`Cannot establish BlinkCode session (${response.status})`);
    const data = await response.json();
    if (typeof data?.token !== 'string' || !data.token) throw new Error('BlinkCode session token is missing');
    sessionToken = data.token;
    return sessionToken;
  }).finally(() => {
    pendingSession = null;
  });

  return pendingSession;
}

export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const perform = async () => {
    const token = await ensureApiSession();
    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${token}`);
    return fetch(url, { ...options, headers });
  };

  let response = await perform();
  if (response.status === 401) {
    clearApiSession();
    response = await perform();
  }
  return response;
}

export async function authenticatedWebSocketUrl(url: string): Promise<string> {
  const token = await ensureApiSession();
  const authenticated = new URL(url, window.location.href);
  authenticated.searchParams.set('token', token);
  return authenticated.toString();
}
