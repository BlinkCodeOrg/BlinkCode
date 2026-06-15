import type { FileNode } from '../../types';

export function isMarkdownSourceFile(file: FileNode | null): boolean {
  return Boolean(file && !file.markdownPreviewContent && /\.(md|mdx|markdown)$/i.test(file.name));
}
