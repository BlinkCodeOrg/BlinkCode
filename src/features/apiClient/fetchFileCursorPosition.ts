import { API } from './apiBase';
import { request } from './request';

export interface FileCursorPosition {
  line: number;
  column: number;
  viewState?: unknown;
}

export async function fetchFileCursorPosition(serverPath: string): Promise<FileCursorPosition | null> {
  const data = await request(`${API}/file-cursor?path=${encodeURIComponent(serverPath)}`);
  if (!data.line || !data.column) return null;
  return {
    line: Number(data.line),
    column: Number(data.column),
    viewState: data.viewState,
  };
}
