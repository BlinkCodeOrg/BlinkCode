import type { FileNode } from '../../types';

export function createMarkdownPreviewNode(file: FileNode): FileNode {
  return {
    id: `markdown-preview:${file.serverPath}`,
    name: `${file.name} Preview`,
    type: 'file',
    language: 'markdown',
    content: '',
    dirty: false,
    serverPath: `__markdown_preview__/${file.serverPath}`,
    markdownPreviewContent: file.content || '',
    markdownPreviewSourcePath: file.serverPath,
  };
}
