import type { FileNode } from '../types';
import { createFileNodesFromTemplates } from '../features/initialFiles/createFileNodesFromTemplates';
import { initialFileTemplates } from '../features/initialFiles/initialFileTemplates';

export function getInitialFiles(): FileNode[] {
  return createFileNodesFromTemplates(initialFileTemplates);
}
