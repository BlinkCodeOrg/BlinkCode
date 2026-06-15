import { API } from './apiBase';
import { request } from './request';

export async function saveFileCursorPosition(serverPath: string, line: number, column: number, viewState?: unknown): Promise<void> {
  await request(`${API}/file-cursor`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filePath: serverPath, line, column, viewState }),
  });
}
