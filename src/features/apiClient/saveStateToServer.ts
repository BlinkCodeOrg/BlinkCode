import type { SavedEditorState } from '../../types';
import { API } from './apiBase';
import { request } from './request';

export async function saveStateToServer(data: SavedEditorState): Promise<void> {
  await request(`${API}/state`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}
