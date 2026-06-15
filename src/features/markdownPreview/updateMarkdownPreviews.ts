import type { FileNode } from '../../types';

export function updateMarkdownPreviews(nodes: FileNode[], sourcePath: string, content: string): FileNode[] {
  return nodes.map(n => {
    const node = n.markdownPreviewSourcePath === sourcePath
      ? { ...n, markdownPreviewContent: content }
      : n;
    if (node.children) return { ...node, children: updateMarkdownPreviews(node.children, sourcePath, content) };
    return node;
  });
}
