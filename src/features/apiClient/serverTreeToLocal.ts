import { v4 as uuid } from 'uuid';
import type { FileNode } from '../../types';
import { getLanguageFromFileName } from '../../utils/fileIcons';
import { isBinary } from './isBinary';
import type { ServerTreeItem } from './serverTreeItem';

export function serverTreeToLocal(items: ServerTreeItem[], depth = 0): FileNode[] {
  return items.map(item => {
    const node: FileNode = {
      id: uuid(),
      name: item.name,
      type: item.type,
      language: item.type === 'file' ? getLanguageFromFileName(item.name) : undefined,
      isExpanded: false,
      children: item.children ? serverTreeToLocal(item.children, depth + 1) : undefined,
      content: undefined,
      serverPath: item.path,
      binary: item.type === 'file' ? isBinary(item.name) : undefined,
      size: item.type === 'file' ? item.size : undefined,
    };
    return node;
  });
}
