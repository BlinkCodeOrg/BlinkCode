import type { FileNode } from '../../types';
import { sortNodes } from '../../features/workspaceTree/sortNodes';
import { filterSidebarNode } from './filterSidebarNode';
import { getExplorerGitDecoration } from '../../features/sidebar/getExplorerGitDecoration';
import { SidebarTreeNode } from './SidebarTreeNode';
import type { InlineInput } from './sidebarTypes';

interface SidebarTreeProps {
  nodes: FileNode[];
  activeFileId: string | null | undefined;
  depth?: number;
  filter: string;
  gitDecorations: Map<string, string> | Record<string, string>;
  inline: InlineInput | null;
  inlineRef: React.RefObject<HTMLInputElement | null>;
  itemEls: React.RefObject<Map<string, HTMLDivElement>>;
  openFile: (file: FileNode) => void;
  renameRef: React.RefObject<HTMLInputElement | null>;
  renameVal: string;
  renamingId: string | null;
  setInline: React.Dispatch<React.SetStateAction<InlineInput | null>>;
  setRenameVal: React.Dispatch<React.SetStateAction<string>>;
  setRenamingId: React.Dispatch<React.SetStateAction<string | null>>;
  showFileIcons: boolean;
  sidebarCtx: any;
  sidebarDrag: any;
  submitInline: () => void;
  submitRename: () => void;
  toggleFolder: (id: string) => void;
  tt: (key: string) => string;
}

export function SidebarTree(props: SidebarTreeProps) {
  const depth = props.depth || 0;
  const sorted = sortNodes(props.nodes.filter(node => filterSidebarNode(node, props.filter)));
  return sorted.map(node => {
    const hasVisibleChildren = node.type === 'folder'
      && Boolean(node.isExpanded)
      && (node.children || []).some(child => filterSidebarNode(child, props.filter));
    return (
      <SidebarTreeNode
        key={node.id}
        activeFileId={props.activeFileId}
        depth={depth}
        drag={props.sidebarDrag.drag}
        draggingId={props.sidebarDrag.draggingId}
        hasVisibleChildren={hasVisibleChildren}
        gitDecoration={node.serverPath ? getExplorerGitDecoration(node.serverPath, props.gitDecorations as any) : undefined}
        inline={props.inline}
        inlineRef={props.inlineRef}
        itemEls={props.itemEls}
        node={node}
        onContextMenu={props.sidebarCtx.onCtx}
        onDragEnd={props.sidebarDrag.onDragEnd}
        onDragLeave={props.sidebarDrag.onDragLeave}
        onDragOver={props.sidebarDrag.onDragOver}
        onDragStart={props.sidebarDrag.onDragStart}
        onDrop={props.sidebarDrag.onDrop}
        onInlineCancel={() => props.setInline(null)}
        onInlineChange={props.setInline}
        onOpenFile={props.openFile}
        onRenameCancel={() => { props.setRenamingId(null); props.setRenameVal(''); }}
        onRenameChange={props.setRenameVal}
        onSubmitInline={props.submitInline}
        onSubmitRename={props.submitRename}
        onToggleFolder={props.toggleFolder}
        renameRef={props.renameRef}
        renameVal={props.renameVal}
        renamingId={props.renamingId}
        renderChildren={children => <SidebarTree {...props} nodes={children} depth={depth + 1} />}
        showFileIcons={props.showFileIcons}
        tt={props.tt}
      />
    );
  });
}
