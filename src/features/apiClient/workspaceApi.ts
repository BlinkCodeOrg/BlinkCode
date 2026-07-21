import type { EditorSettings, FileNode, SavedEditorState } from '../../types';
import { API } from './apiBase';
import { pathBasename } from './pathBasename';
import type { RecoveryBuffer } from './recoveryTypes';
import { request } from './request';
import { serverTreeToLocal } from './serverTreeToLocal';
import type { SettingsResponse } from './settingsTypes';

export async function addWorkspaceRoot(dirPath: string): Promise<void> {
  await request(`${API}/workspace/roots`, jsonRequest('POST', { dirPath }));
}

export async function closeWorkspace(): Promise<void> {
  await request(`${API}/close-workspace`, { method: 'POST' });
}

export async function fetchRecentProjects(): Promise<Array<{ path: string; name: string }>> {
  const data = await request(`${API}/recent-projects`);
  return Array.isArray(data.projects) ? data.projects : [];
}

export async function fetchRecoveryBuffers(): Promise<RecoveryBuffer[]> {
  const data = await request(`${API}/recovery`);
  return Array.isArray(data.buffers) ? data.buffers : [];
}

export function fetchSettings(): Promise<SettingsResponse> {
  return request(`${API}/settings`);
}

export function fetchSettingsRaw(scope: 'global' | 'workspace' = 'global'): Promise<{ content: string; path: string }> {
  return request(`${API}/settings/raw?scope=${scope}`);
}

export function fetchState(): Promise<SavedEditorState> {
  return request(`${API}/state`);
}

export async function fetchTree(): Promise<{ files: FileNode[]; workspaceName: string; workspacePath: string }> {
  const data = await request(`${API}/tree`);
  return {
    files: serverTreeToLocal(data.tree || []),
    workspaceName: data.workspace || 'workspace',
    workspacePath: data.workspacePath || '',
  };
}

export async function openFolderOnServer(dirPath: string): Promise<{ files: FileNode[]; workspaceName: string }> {
  const data = await request(`${API}/open-folder`, jsonRequest('POST', { dirPath }));
  return {
    files: serverTreeToLocal(data.tree || []),
    workspaceName: data.workspace || pathBasename(dirPath),
  };
}

export async function uploadFolder(name: string, files: { path: string; type: string; content?: string }[]): Promise<{ files: FileNode[]; workspaceName: string }> {
  const data = await request(`${API}/upload-folder`, jsonRequest('POST', { name, files }));
  return { files: serverTreeToLocal(data.tree || []), workspaceName: data.workspace || name };
}

export async function deleteRecoveryBuffer(filePath: string): Promise<void> {
  await request(`${API}/recovery?path=${encodeURIComponent(filePath)}`, { method: 'DELETE' });
}

export async function saveRecoveryBuffer(filePath: string, content: string): Promise<void> {
  await request(`${API}/recovery`, jsonRequest('PUT', { filePath, content }));
}

export async function saveSettingsRaw(content: string, scope: 'global' | 'workspace' = 'global'): Promise<void> {
  await request(`${API}/settings/raw?scope=${scope}`, jsonRequest('PUT', { content }));
}

export async function saveSettingsToServer(settings: Partial<EditorSettings>, scope: 'global' | 'workspace' = 'global'): Promise<void> {
  await request(`${API}/settings?scope=${scope}`, jsonRequest('PUT', settings));
}

export async function saveStateToServer(data: SavedEditorState): Promise<void> {
  await request(`${API}/state`, jsonRequest('PUT', data));
}

function jsonRequest(method: string, body: unknown): RequestInit {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}
