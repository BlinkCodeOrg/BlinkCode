import path from 'path';
import { fileURLToPath } from 'url';

function toWorkspacePath(url, workspaceRoot) {
  if (!url) return '';
  if (url.startsWith('node:')) return url;
  try {
    const absolutePath = url.startsWith('file:') ? fileURLToPath(url) : url;
    const relativePath = path.relative(workspaceRoot, absolutePath).replace(/\\/g, '/');
    return relativePath.startsWith('..') ? absolutePath : relativePath;
  } catch {
    return url || '';
  }
}

export function formatCallFrames(callFrames, workspaceRoot) {
  return (callFrames || []).map(frame => ({
    id: frame.callFrameId,
    functionName: frame.functionName || '(anonymous)',
    path: toWorkspacePath(frame.url, workspaceRoot),
    line: Number(frame.location?.lineNumber || 0) + 1,
    column: Number(frame.location?.columnNumber || 0) + 1,
    scopes: (frame.scopeChain || []).map(scope => ({
      type: scope.type,
      name: scope.name || scope.type,
      objectId: scope.object?.objectId || null,
    })),
  }));
}
