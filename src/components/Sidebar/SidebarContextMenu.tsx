import { Copy, ExternalLink, File, FilePlus, FolderPlus, Pencil, Trash2 } from 'lucide-react';

export interface SidebarContextMenuState {
  x: number;
  y: number;
  nodeId: string | null;
  nodeType: 'file' | 'folder' | null;
}

type SidebarContextMenuProps = {
  ctx: SidebarContextMenuState;
  tt: (key: string) => string;
  onOpen: () => void;
  onRename: () => void;
  onDelete: () => void;
  onNewFile: () => void;
  onNewFolder: () => void;
  onCopyPath: (kind: 'absolute' | 'relative' | 'name') => void;
  onReveal: () => void;
};

export function SidebarContextMenu({
  ctx,
  tt,
  onOpen,
  onRename,
  onDelete,
  onNewFile,
  onNewFolder,
  onCopyPath,
  onReveal,
}: SidebarContextMenuProps) {
  return (
    <div className="ctx-menu" style={{ left: ctx.x, top: ctx.y }} onClick={e => e.stopPropagation()}>
      {ctx.nodeType === 'file' && (
        <div>
          <button className="ctx-item" onClick={onOpen}><File size={13} /> {tt('ctx.open')}</button>
          <button className="ctx-item" onClick={onRename}><Pencil size={13} /> {tt('ctx.rename')}</button>
          <button className="ctx-item" onClick={() => onCopyPath('absolute')}><Copy size={13} /> {tt('ctx.copyPath')}</button>
          <button className="ctx-item" onClick={() => onCopyPath('relative')}><Copy size={13} /> {tt('ctx.copyRelativePath')}</button>
          <button className="ctx-item" onClick={() => onCopyPath('name')}><Copy size={13} /> {tt('ctx.copyFileName')}</button>
          <button className="ctx-item" onClick={onReveal}><ExternalLink size={13} /> {tt('ctx.revealInExplorer')}</button>
          <div className="ctx-sep" />
          <button className="ctx-item danger" onClick={onDelete}><Trash2 size={13} /> {tt('ctx.delete')}</button>
        </div>
      )}
      {ctx.nodeType === 'folder' && (
        <div>
          <button className="ctx-item" onClick={onNewFile}><FilePlus size={13} /> {tt('ctx.newFile')}</button>
          <button className="ctx-item" onClick={onNewFolder}><FolderPlus size={13} /> {tt('ctx.newFolder')}</button>
          <button className="ctx-item" onClick={onRename}><Pencil size={13} /> {tt('ctx.rename')}</button>
          <button className="ctx-item" onClick={() => onCopyPath('absolute')}><Copy size={13} /> {tt('ctx.copyPath')}</button>
          <button className="ctx-item" onClick={() => onCopyPath('relative')}><Copy size={13} /> {tt('ctx.copyRelativePath')}</button>
          <button className="ctx-item" onClick={onReveal}><ExternalLink size={13} /> {tt('ctx.revealInExplorer')}</button>
          <div className="ctx-sep" />
          <button className="ctx-item danger" onClick={onDelete}><Trash2 size={13} /> {tt('ctx.delete')}</button>
        </div>
      )}
      {!ctx.nodeType && (
        <div>
          <button className="ctx-item" onClick={onNewFile}><FilePlus size={13} /> {tt('ctx.newFile')}</button>
          <button className="ctx-item" onClick={onNewFolder}><FolderPlus size={13} /> {tt('ctx.newFolder')}</button>
        </div>
      )}
    </div>
  );
}
