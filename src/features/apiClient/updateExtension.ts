import { API } from './apiBase';
import { request } from './request';
import type { ExtensionSnapshot } from '../extensions/extensionTypes';

export type ExtensionOperation = 'install' | 'update' | 'uninstall' | 'enable' | 'disable';

export function updateExtension(id: string, operation: ExtensionOperation): Promise<ExtensionSnapshot> {
  return request(`${API}/extensions/${encodeURIComponent(id)}/${operation}`, { method: 'POST' });
}
