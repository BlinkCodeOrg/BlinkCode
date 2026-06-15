import { v4 as uuid } from 'uuid';
import type { FileNode } from '../../types';
import type { InitialFileTemplate } from './initialFileTemplate';

export function createFileNodesFromTemplates(templates: InitialFileTemplate[]): FileNode[] {
  return templates.map(template => ({
    ...template,
    id: uuid(),
    children: template.children ? createFileNodesFromTemplates(template.children) : undefined,
  }));
}
