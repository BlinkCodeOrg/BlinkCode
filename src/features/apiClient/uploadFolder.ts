import type { FileNode } from '../../types';
import { API } from './apiBase';
import { request } from './request';
import { serverTreeToLocal } from './serverTreeToLocal';

export async function uploadFolder(name: string, files: { path: string; type: string; content?: string }[]): Promise<{ files: FileNode[]; workspaceName: string }> {
  const data = await request(`${API}/upload-folder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, files }),
  });
  return {
    files: serverTreeToLocal(data.tree || []),
    workspaceName: data.workspace || name,
  };
}
