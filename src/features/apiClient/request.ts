import { parseApiResponse } from './parseApiResponse';
import { authenticatedFetch } from './apiSession';

export async function request(url: string, options?: RequestInit): Promise<any> {
  const res = await authenticatedFetch(url, options);
  const raw = await res.text();
  let data: any = null;
  try {
    data = parseApiResponse(raw, res.headers.get('content-type'));
  } catch (error) {
    if (res.ok) throw error;
  }

  if (!res.ok) {
    const serverMessage = data?.error || data?.message || raw;
    const suffix = serverMessage ? ` - ${String(serverMessage).trim()}` : '';
    throw new Error(`API error: ${res.status}${suffix}`);
  }

  return data ?? {};
}
