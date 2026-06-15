import { API } from './apiBase';
import { request } from './request';
import type { ExtensionSnapshot } from '../extensions/extensionTypes';

export function fetchExtensions(refresh = false): Promise<ExtensionSnapshot> {
  return request(`${API}/extensions${refresh ? '?refresh=1' : ''}`);
}
