import { fetchAiProviderStatus } from '../apiClient/fetchAiProviderStatus';
import type { AiConfig } from './aiConfig';

let cachedKey = '';
let cachedValue = false;
let checkedAt = 0;
let pending: Promise<boolean> | null = null;

export async function isAiProviderAvailable(config: AiConfig): Promise<boolean> {
  const key = JSON.stringify(config);
  if (key === cachedKey && Date.now() - checkedAt < 30_000) return cachedValue;
  if (pending && key === cachedKey) return pending;

  cachedKey = key;
  pending = fetchAiProviderStatus(config)
    .then(status => {
      cachedValue = status.connected;
      checkedAt = Date.now();
      return cachedValue;
    })
    .catch(() => {
      cachedValue = false;
      checkedAt = Date.now();
      return false;
    })
    .finally(() => {
      pending = null;
    });
  return pending;
}

export function invalidateAiProviderAvailability() {
  checkedAt = 0;
}
