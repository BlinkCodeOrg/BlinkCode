import { API } from './apiBase';
import type { RestClientRequest, RestClientResponse } from './restClientTypes';
import { request } from './request';

export function sendRestClientRequest(content: string, requestIndex: number): Promise<{
  request: RestClientRequest;
  response: RestClientResponse;
}> {
  return request(`${API}/rest-client/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, requestIndex }),
  });
}
