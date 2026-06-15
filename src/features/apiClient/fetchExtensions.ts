import { API } from './apiBase';
import { request } from './request';
import type { ExtensionSnapshot } from '../extensions/extensionTypes';

export function fetchExtensions(): Promise<ExtensionSnapshot> {
  return request(`${API}/extensions`);
}
