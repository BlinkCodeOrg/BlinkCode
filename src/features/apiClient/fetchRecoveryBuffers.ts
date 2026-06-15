import { API } from './apiBase';
import { request } from './request';
import type { RecoveryBuffer } from './recoveryTypes';

export async function fetchRecoveryBuffers(): Promise<RecoveryBuffer[]> {
  const data = await request(`${API}/recovery`);
  return Array.isArray(data.buffers) ? data.buffers : [];
}
