import type { FileNode } from '../../types';
import { API } from './apiBase';
import { pathBasename } from './pathBasename';
import { request } from './request';
import { serverTreeToLocal } from './serverTreeToLocal';

export async function openFolderOnServer(dirPath: string): Promise<{ files: FileNode[]; workspaceName: string }> {
  const data = await request(`${API}/open-folder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dirPath }),
  });
  return {
    files: serverTreeToLocal(data.tree || []),
    workspaceName: data.workspace || pathBasename(dirPath),
  };
}
