import type { SavedEditorState } from '../../types';
import { API } from './apiBase';
import { request } from './request';

export async function fetchState(): Promise<SavedEditorState> {
  return request(`${API}/state`);
}
