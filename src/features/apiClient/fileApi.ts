import { API } from './apiBase';
import { request } from './request';

export interface FileCursorPosition {
  line: number;
  column: number;
  viewState?: unknown;
}

export interface LargeFilePreviewChunk {
  content: string;
  offset: number;
  size: number;
  done: boolean;
}

export async function createFileOnServer(serverPath: string, type: 'file' | 'folder'): Promise<void> {
  await request(`${API}/create`, jsonRequest('POST', { filePath: serverPath, type }));
}

export async function deleteOnServer(serverPath: string): Promise<void> {
  await request(`${API}/delete?path=${encodeURIComponent(serverPath)}`, { method: 'DELETE' });
}

export async function fetchFileContent(serverPath: string, binary?: boolean): Promise<string> {
  if (binary) return '';
  const data = await request(`${API}/file?path=${encodeURIComponent(serverPath)}`);
  return data.content || '';
}

export async function fetchFileCursorPosition(serverPath: string): Promise<FileCursorPosition | null> {
  const data = await request(`${API}/file-cursor?path=${encodeURIComponent(serverPath)}`);
  if (!data.line || !data.column) return null;
  return { line: Number(data.line), column: Number(data.column), viewState: data.viewState };
}

export function fetchLargeFilePreview(serverPath: string, offset = 0): Promise<LargeFilePreviewChunk> {
  const params = new URLSearchParams({ path: serverPath, offset: String(offset) });
  return request(`${API}/file-preview?${params.toString()}`);
}

export async function moveOnServer(sourcePath: string, targetPath: string | null, position: string): Promise<{ newPath: string }> {
  const data = await request(`${API}/move`, jsonRequest('POST', { sourcePath, targetPath, position }));
  return { newPath: data.newPath };
}

export async function renameOnServer(oldPath: string, newName: string): Promise<{ newPath: string }> {
  const data = await request(`${API}/rename`, jsonRequest('POST', { oldPath, newName }));
  return { newPath: data.newPath };
}

export async function saveFile(serverPath: string, content: string): Promise<void> {
  await request(`${API}/file`, jsonRequest('PUT', { filePath: serverPath, content }));
}

export async function saveFileCursorPosition(serverPath: string, line: number, column: number, viewState?: unknown): Promise<void> {
  await request(`${API}/file-cursor`, jsonRequest('PUT', { filePath: serverPath, line, column, viewState }));
}

function joinWorkspacePath(workspaceDir: string, serverPath: string) {
  const separator = workspaceDir.includes('\\') ? '\\' : '/';
  return `${workspaceDir.replace(/[\\/]+$/, '')}${separator}${serverPath.replace(/\//g, separator)}`;
}

export async function trashOnServer(serverPath: string, workspaceDir: string): Promise<void> {
  if (workspaceDir && window.electronAPI?.trashItem) {
    const moved = await window.electronAPI.trashItem(joinWorkspacePath(workspaceDir, serverPath));
    if (moved) return;
  }
  await request(`${API}/trash`, jsonRequest('POST', { filePath: serverPath }));
}

function jsonRequest(method: string, body: unknown): RequestInit {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}
