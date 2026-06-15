import type { FileNode } from '../../types';

export function rewriteNodeServerPath(node: FileNode, nextRootPath: string): FileNode {
  const previousRoot = node.serverPath || '';
  const rewrite = (current: FileNode): FileNode => {
    const suffix = previousRoot && current.serverPath?.startsWith(`${previousRoot}/`)
      ? current.serverPath.slice(previousRoot.length)
      : '';
    return {
      ...current,
      serverPath: current.id === node.id ? nextRootPath : suffix ? `${nextRootPath}${suffix}` : current.serverPath,
      children: current.children?.map(rewrite),
    };
  };
  return rewrite(node);
}
