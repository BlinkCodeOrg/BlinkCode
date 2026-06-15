import { ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react';
import type { FileNode } from '../../types';
import { getFileIcon } from '../../utils/fileIcons';
import { isSupportedWebFile } from '../../utils/supportedWebFiles';
import type { DragState, InlineInput } from './sidebarTypes';
import { SidebarInlineInput } from './SidebarInlineInput';
import { Input } from '../ui/Input';
import type { ExplorerGitDecoration } from '../../features/sidebar/useExplorerGitDecorations';

interface SidebarTreeNodeProps {
  activeFileId: string | null | undefined;
  depth: number;
  drag: DragState;
  draggingId: string | null;
  inline: InlineInput | null;
  inlineRef: React.RefObject<HTMLInputElement | null>;
  itemEls: React.RefObject<Map<string, HTMLDivElement>>;
  node: FileNode;
  renameRef: React.RefObject<HTMLInputElement | null>;
  renameVal: string;
  renamingId: string | null;
  showFileIcons: boolean;
  tt: (key: string) => string;
  hasVisibleChildren: boolean;
  gitDecoration?: ExplorerGitDecoration;
  onContextMenu: (event: React.MouseEvent, nodeId: string | null, nodeType: 'file' | 'folder' | null) => void;
  onDragEnd: () => void;
  onDragLeave: (event: React.DragEvent) => void;
  onDragOver: (event: React.DragEvent, id: string) => void;
  onDragStart: (id: string) => void;
  onDrop: (event: React.DragEvent, id: string) => void;
  onInlineCancel: () => void;
  onInlineChange: (inline: InlineInput) => void;
  onOpenFile: (node: FileNode) => void;
  onRenameCancel: () => void;
  onRenameChange: (value: string) => void;
  onSubmitInline: () => void;
  onSubmitRename: () => void;
  onToggleFolder: (id: string) => void;
  renderChildren: (nodes: FileNode[], depth: number) => React.ReactNode;
}

export function SidebarTreeNode({
  activeFileId,
  depth,
  drag,
  draggingId,
  hasVisibleChildren,
  gitDecoration,
  inline,
  inlineRef,
  itemEls,
  node,
  onContextMenu,
  onDragEnd,
  onDragLeave,
  onDragOver,
  onDragStart,
  onDrop,
  onInlineCancel,
  onInlineChange,
  onOpenFile,
  onRenameCancel,
  onRenameChange,
  onSubmitInline,
  onSubmitRename,
  onToggleFolder,
  renameRef,
  renameVal,
  renamingId,
  renderChildren,
  showFileIcons,
  tt,
}: SidebarTreeNodeProps) {
  const icon = node.type === 'file' ? getFileIcon(node.name) : null;
  const isActive = node.id === activeFileId;
  const isDragOver = drag.overId === node.id;
  const dropPos = isDragOver ? drag.position : null;
  const isDragging = draggingId === node.id;
  const isUnsupported = node.type === 'file' && !node.binary && !isSupportedWebFile(node.name);
  const indent = depth * 14;
  const showGuides = depth > 0;

  return (
    <div className={`tree-row-wrapper ${isDragging ? 'dragging' : ''}`}>
      {dropPos === 'before' && (
        <div className="drop-indicator">
          <div className="drop-line-h" style={{ left: 8 + indent }} />
        </div>
      )}
      <div
        ref={el => { if (el) itemEls.current.set(node.id, el); }}
        className={`tree-row ${(node as FileNode & { root?: boolean }).root ? 'tree-row-root' : ''} ${isActive ? 'tree-row-active' : ''} ${isDragOver && dropPos === 'inside' ? 'tree-row-drop-inside' : ''} ${isDragging ? 'tree-row-dragging' : ''} ${isUnsupported ? 'tree-row-unsupported' : ''}`}
        data-testid="explorer-tree-row"
        data-node-name={node.name}
        data-node-type={node.type}
        data-depth={depth}
        onClick={() => node.type === 'folder' ? onToggleFolder(node.id) : onOpenFile(node)}
        onContextMenu={event => onContextMenu(event, node.id, node.type)}
        title={isUnsupported ? tt('explorer.unsupportedFileHint') : node.name}
        draggable={renamingId !== node.id}
        onDragStart={() => onDragStart(node.id)}
        onDragOver={event => onDragOver(event, node.id)}
        onDrop={event => onDrop(event, node.id)}
        onDragLeave={onDragLeave}
        onDragEnd={onDragEnd}
      >
        {showGuides && (
          <span className="tree-indent" style={{ width: indent }}>
            {Array.from({ length: depth }, (_, index) => (
              <span
                key={index}
                className={`indent-guide ${index === depth - 1 ? 'indent-guide-branch' : ''}`}
                style={{ left: index * 14 + 7 }}
              />
            ))}
          </span>
        )}
        <span className="tree-twistie">
          {node.type === 'folder' ? (
            node.isExpanded ? <ChevronDown size={14} className="twistie-expanded" /> : <ChevronRight size={14} />
          ) : null}
        </span>
        {showFileIcons && <span className="tree-icon">
          {node.type === 'folder' ? (
            node.isExpanded ? <FolderOpen size={15} className="icon-folder-open" /> : <Folder size={15} className="icon-folder" />
          ) : (
            <span className="icon-file-svg" style={{ color: icon?.color }}>{icon?.icon}</span>
          )}
        </span>}
        {renamingId === node.id ? (
          <Input
            ref={renameRef}
            className="tree-rename-input"
            value={renameVal}
            onChange={event => onRenameChange(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') onSubmitRename();
              if (event.key === 'Escape') onRenameCancel();
            }}
            onBlur={onSubmitRename}
            onClick={event => event.stopPropagation()}
            onDragStart={event => event.preventDefault()}
            onMouseDown={event => event.stopPropagation()}
          />
        ) : (
          <span className="tree-label" title={isUnsupported ? tt('explorer.unsupportedFileHint') : node.name}>{node.name}</span>
        )}
        {gitDecoration && (
          <span
            className={`tree-git-decoration tree-git-${gitDecoration.status}`}
            title={gitDecoration.status}
            aria-label={gitDecoration.status}
          >
            {gitDecoration.label}
          </span>
        )}
      </div>
      {node.type === 'folder' && node.isExpanded && (
        <div className="tree-children-block">
          {renderChildren(node.children || [], depth + 1)}
          {inline && inline.parentId === node.id && (
            <SidebarInlineInput
              inputRef={inlineRef}
              type={inline.type}
              value={inline.value}
              paddingLeft={10 + (depth + 1) * 14}
              tt={tt}
              onChange={value => onInlineChange({ ...inline, value })}
              onSubmit={onSubmitInline}
              onCancel={onInlineCancel}
            />
          )}
        </div>
      )}
      {dropPos === 'after' && !hasVisibleChildren && (
        <div className="drop-indicator">
          <div className="drop-line-h" style={{ left: 8 + indent }} />
        </div>
      )}
    </div>
  );
}
