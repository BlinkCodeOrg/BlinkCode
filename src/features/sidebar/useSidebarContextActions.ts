import { useState } from 'react';
import type { FileNode } from '../../types';
import type { SidebarContextMenuState } from '../../components/Sidebar/SidebarContextMenu';
import type { InlineInput } from '../../components/Sidebar/sidebarTypes';
import { getFileNameFromPath } from '../../shared/path/getFileNameFromPath';
import { joinWorkspacePath } from '../../shared/path/joinWorkspacePath';
import { toWindowsPath } from '../../shared/path/toWindowsPath';
import { findNodeById } from '../workspaceTree/findNodeById';
import { requestConfirmation } from '../../shared/ui/requestConfirmation';

interface UseSidebarContextActionsParams {
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  deleteNode: (nodeId: string) => void;
  files: FileNode[];
  openFile: (node: FileNode) => void;
  setInline: (inline: InlineInput | null) => void;
  setRenameVal: (value: string) => void;
  setRenamingId: (id: string | null) => void;
  tt: (key: string, args?: Record<string, string | number>) => string;
  workspaceDir: string;
}

export function useSidebarContextActions({
  addToast,
  deleteNode,
  files,
  openFile,
  setInline,
  setRenameVal,
  setRenamingId,
  tt,
  workspaceDir,
}: UseSidebarContextActionsParams) {
  const [ctx, setCtx] = useState<SidebarContextMenuState | null>(null);
  const getCtxNode = () => ctx?.nodeId ? findNodeById(files, ctx.nodeId) : null;
  const closeCtx = () => setCtx(null);

  const onCtx = (event: React.MouseEvent, nodeId: string | null, nodeType: 'file' | 'folder' | null) => {
    event.preventDefault();
    event.stopPropagation();
    setCtx({ x: event.clientX, y: event.clientY, nodeId, nodeType });
  };

  const open = () => {
    if (ctx?.nodeId) {
      const node = findNodeById(files, ctx.nodeId);
      if (node) openFile(node);
    }
    closeCtx();
  };

  const rename = () => {
    if (ctx?.nodeId) {
      const node = findNodeById(files, ctx.nodeId);
      if (node) {
        setRenamingId(node.id);
        setRenameVal(node.name);
      }
    }
    closeCtx();
  };

  const remove = async () => {
    const node = getCtxNode();
    closeCtx();
    if (!node) return;

    const confirmed = await requestConfirmation({
      cancelLabel: tt('common.cancel'),
      confirmLabel: tt('trash.action'),
      danger: true,
      details: node.serverPath,
      message: tt('trash.message', { type: tt(node.type === 'folder' ? 'trash.folder' : 'trash.file'), name: node.name }),
      title: tt('trash.title'),
    });
    if (confirmed) deleteNode(node.id);
  };

  const newFile = () => {
    setInline({ parentId: ctx?.nodeId ?? null, type: 'file', value: '' });
    closeCtx();
  };

  const newFolder = () => {
    setInline({ parentId: ctx?.nodeId ?? null, type: 'folder', value: '' });
    closeCtx();
  };

  const copyPath = async (kind: 'absolute' | 'relative' | 'name') => {
    const node = getCtxNode();
    if (!node?.serverPath) return;
    const value = kind === 'absolute'
      ? joinWorkspacePath(workspaceDir, node.serverPath)
      : kind === 'name'
        ? getFileNameFromPath(node.serverPath)
        : toWindowsPath(node.serverPath);
    try {
      await navigator.clipboard.writeText(value);
      addToast(tt('toast.copied'), 'success');
    } catch {}
    closeCtx();
  };

  const reveal = async () => {
    const node = getCtxNode();
    if (!node?.serverPath) return;
    try {
      const ok = await window.electronAPI?.revealInFolder?.(joinWorkspacePath(workspaceDir, node.serverPath));
      if (!ok) addToast(tt('toast.revealUnavailable'), 'error');
    } catch {
      addToast(tt('toast.revealUnavailable'), 'error');
    }
    closeCtx();
  };

  return {
    ctx,
    closeCtx,
    copyPath,
    newFile,
    newFolder,
    onCtx,
    open,
    remove,
    rename,
    reveal,
    setCtx,
  };
}
