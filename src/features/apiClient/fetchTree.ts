import type { FileNode } from '../../types';
import { API } from './apiBase';
import { request } from './request';
import { serverTreeToLocal } from './serverTreeToLocal';

export async function fetchTree(): Promise<{ files: FileNode[]; workspaceName: string; workspacePath: string }> {
  const data = await request(`${API}/tree`);
  return {
    files: serverTreeToLocal(data.tree || []),
    workspaceName: data.workspace || 'workspace',
    workspacePath: data.workspacePath || '',
  };
}
