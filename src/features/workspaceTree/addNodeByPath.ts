import { v4 as uuid } from 'uuid';
import type { FileNode } from '../../types';
import { isBinary } from '../apiClient/isBinary';
import { getMonacoLanguage } from '../../utils/supportedWebFiles';
import { sortNodes } from './sortNodes';

export function addNodeByPath(
  nodes: FileNode[],
  segments: string[],
  type: 'file' | 'folder',
  name: string,
  fullPath: string,
): FileNode[] {
  if (segments.length === 0) {
    if (nodes.some((node) => node.name === name && node.type === type))
      return nodes;
    const newNode: FileNode = {
      id: uuid(),
      name,
      type,
      serverPath: fullPath,
      ...(type === 'folder'
        ? { children: [] }
        : {
            language: getMonacoLanguage(name),
            dirty: false,
            binary: isBinary(name),
          }),
    };
    return sortNodes([...nodes, newNode]);
  }

  const [head, ...tail] = segments;
  let idx = nodes.findIndex(
    (node) => node.type === 'folder' && node.name === head,
  );

  if (idx === -1) {
    const parentPath = segments.join('/');
    const parent: FileNode = {
      id: uuid(),
      name: head,
      type: 'folder',
      serverPath: parentPath,
      isExpanded: true,
      children: [],
    };
    const updated = sortNodes([...nodes, parent]);
    idx = updated.findIndex(
      (node) => node.type === 'folder' && node.name === head,
    );
    nodes = updated;
  }

  return nodes.map((node, index) => {
    if (index !== idx) return node;
    return {
      ...node,
      isExpanded: true,
      children: addNodeByPath(node.children || [], tail, type, name, fullPath),
    };
  });
}
