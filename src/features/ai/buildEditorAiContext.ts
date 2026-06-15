import type { AiContext } from '../apiClient/aiTypes';
import type { FileNode, Tab } from '../../types';

export function buildEditorAiContext(files: FileNode[], tabs: Tab[], activeFile: FileNode | null): AiContext {
  const editor = (window as any).__blinkcodeEditor;
  const selection = editor?.getSelection?.();
  const selectedText = selection && !selection.isEmpty?.() ? editor.getModel?.()?.getValueInRange(selection) : '';
  return {
    activeFile: activeFile?.serverPath ? {
      path: activeFile.serverPath,
      language: activeFile.language,
      content: activeFile.content || '',
    } : undefined,
    selection: selectedText || undefined,
    openFiles: tabs.map(tab => findPathById(files, tab.fileId)).filter(Boolean) as string[],
    workspaceFiles: flattenPaths(files),
  };
}

function flattenPaths(nodes: FileNode[]): string[] {
  const paths: string[] = [];
  for (const node of nodes) {
    if (node.serverPath) paths.push(`${node.type === 'folder' ? '[dir] ' : ''}${node.serverPath}`);
    if (node.children) paths.push(...flattenPaths(node.children));
  }
  return paths;
}

function findPathById(nodes: FileNode[], id: string): string | null {
  for (const node of nodes) {
    if (node.id === id) return node.serverPath || node.name;
    const child = node.children && findPathById(node.children, id);
    if (child) return child;
  }
  return null;
}
