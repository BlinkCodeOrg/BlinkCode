import { useState, useRef, useEffect, useCallback } from 'react';
import { useEditor } from '../../store/EditorContext';
import type { FileNode } from '../../types';
import { useT } from '../../hooks/useT';
import { useHorizontalResize } from '../../hooks/useHorizontalResize';
import { closeWorkspace } from '../../utils/api';
import { sortNodes } from '../../features/workspaceTree/sortNodes';
import { openFolderFromPicker } from '../../features/sidebar/openFolderFromPicker';
import { useSidebarContextActions } from '../../features/sidebar/useSidebarContextActions';
import { uploadDroppedFiles } from '../../features/sidebar/uploadDroppedFiles';
import { useSidebarDragAndDrop } from '../../features/sidebar/useSidebarDragAndDrop';
import { useRecentProjects } from '../../features/sidebar/useRecentProjects';
import { SidebarContextMenu } from './SidebarContextMenu';
import { SidebarEmptyState } from './SidebarEmptyState';
import { SidebarFilter } from './SidebarFilter';
import { SidebarHeader } from './SidebarHeader';
import { SidebarInlineInput } from './SidebarInlineInput';
import { SidebarTreeNode } from './SidebarTreeNode';
import { filterSidebarNode } from './filterSidebarNode';
import type { InlineInput } from './sidebarTypes';
import { SidebarPanel } from '../ui/SidebarPanel';
import { getDroppedFolderPath } from '../../features/sidebar/getDroppedFolderPath';
import { fetchTree } from '../../utils/api';
import { findNodeByPath } from '../../features/workspaceTree/findNodeByPath';
import { useExplorerGitDecorations } from '../../features/sidebar/useExplorerGitDecorations';
import { getDirtyFiles } from '../../features/dirtyFiles/getDirtyFiles';
import { addWorkspaceRootFromPicker } from '../../features/sidebar/addWorkspaceRootFromPicker';
import { getExplorerGitDecoration } from '../../features/sidebar/getExplorerGitDecoration';
import './Sidebar.css';

export default function Sidebar() {
  const { state, openFile, toggleFolder, addFile, deleteNode, renameNode, moveNode, updateSettings, loadFromServer, addToast, dispatch, openFolderFromServer } = useEditor();
  const tt = useT();
  const recentProjects = useRecentProjects(state.workspaceDir, state.files.length);
  const gitDecorations = useExplorerGitDecorations(state.workspaceDir);
  const handleOpenFolder = useCallback(async () => {
    await openFolderFromPicker({ addToast, dispatch, openFolderFromServer, tt });
  }, [addToast, dispatch, openFolderFromServer, tt]);
  const handleCloseFolder = useCallback(async () => {
    if (getDirtyFiles(state.files).length > 0) {
      addToast(tt('explorer.dirtyCloseProject'), 'error');
      return;
    }
    dispatch({ type: 'CLOSE_FOLDER' });
    try { await closeWorkspace(); } catch {}
  }, [addToast, dispatch, state.files, tt]);
  const handleAddRoot = useCallback(async () => {
    await addWorkspaceRootFromPicker({ addToast, loadFromServer, tt });
  }, [addToast, loadFromServer, tt]);
  const [inline, setInline] = useState<InlineInput | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');
  const [filter, setFilter] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const inlineRef = useRef<HTMLInputElement>(null);
  const renameRef = useRef<HTMLInputElement>(null);
  const filterRef = useRef<HTMLInputElement>(null);
  const itemEls = useRef<Map<string, HTMLDivElement>>(new Map());
  const sidebarDrag = useSidebarDragAndDrop({ files: state.files, itemEls, moveNode });
  const sidebarCtx = useSidebarContextActions({
    addToast,
    deleteNode,
    files: state.files,
    openFile,
    setInline,
    setRenameVal,
    setRenamingId,
    tt,
    workspaceDir: state.workspaceDir,
  });
  const visibleFiles = state.files.filter(node => filterSidebarNode(node, filter));
  const activeFileId = state.activeTabId ? state.openTabs.find(t => t.id === state.activeTabId)?.fileId : null;

  useEffect(() => { if (inline) inlineRef.current?.focus(); }, [inline]);
  useEffect(() => {
    if (state.pendingCreate) {
      setInline({ parentId: null, type: state.pendingCreate.type, value: '' });
      dispatch({ type: 'CLEAR_PENDING_CREATE' });
    }
  }, [dispatch, state.pendingCreate]);
  useEffect(() => { if (renamingId) { renameRef.current?.focus(); renameRef.current?.select(); } }, [renamingId]);
  useEffect(() => { if (showFilter) filterRef.current?.focus(); }, [showFilter]);
  useEffect(() => { const h = () => sidebarCtx.closeCtx(); window.addEventListener('click', h); return () => window.removeEventListener('click', h); }, [sidebarCtx]);

  const panelWidth = state.settings.panelWidths.explorer;
  const resizerRef = useHorizontalResize(panelWidth, width => updateSettings({ panelWidths: { ...state.settings.panelWidths, explorer: width } }));

  const submitInline = () => {
    if (!inline) return;
    const v = inline.value.trim();
    if (v) addFile(inline.parentId, v, inline.type);
    setInline(null);
  };
  const submitRename = () => {
    if (renamingId && renameVal.trim()) renameNode(renamingId, renameVal.trim());
    setRenamingId(null);
    setRenameVal('');
  };
  const renderTree = (nodes: FileNode[], depth: number): React.ReactNode => {
    const sorted = sortNodes(nodes.filter(node => filterSidebarNode(node, filter)));
    return sorted.map((node) => {
      const hasVisibleChildren = node.type === 'folder' && !!node.isExpanded && (node.children || []).some(c => filterSidebarNode(c, filter));

      return (
        <SidebarTreeNode
          key={node.id}
          activeFileId={activeFileId}
          depth={depth}
          drag={sidebarDrag.drag}
          draggingId={sidebarDrag.draggingId}
          hasVisibleChildren={hasVisibleChildren}
          gitDecoration={node.serverPath ? getExplorerGitDecoration(node.serverPath, gitDecorations) : undefined}
          inline={inline}
          inlineRef={inlineRef}
          itemEls={itemEls}
          node={node}
          onContextMenu={sidebarCtx.onCtx}
          onDragEnd={sidebarDrag.onDragEnd}
          onDragLeave={sidebarDrag.onDragLeave}
          onDragOver={sidebarDrag.onDragOver}
          onDragStart={sidebarDrag.onDragStart}
          onDrop={sidebarDrag.onDrop}
          onInlineCancel={() => setInline(null)}
          onInlineChange={setInline}
          onOpenFile={openFile}
          onRenameCancel={() => { setRenamingId(null); setRenameVal(''); }}
          onRenameChange={setRenameVal}
          onSubmitInline={submitInline}
          onSubmitRename={submitRename}
          onToggleFolder={toggleFolder}
          renameRef={renameRef}
          renameVal={renameVal}
          renamingId={renamingId}
          renderChildren={renderTree}
          showFileIcons={state.settings.showFileIcons}
          tt={tt}
        />
      );
    });
  };

  const [dropActive, setDropActive] = useState(false);
  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      e.stopPropagation();
      setDropActive(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDropActive(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDropActive(false);
    const folderPath = getDroppedFolderPath(e.dataTransfer);
    if (folderPath) {
      await openFolderFromServer(folderPath);
      addToast(tt('explorer.openedFolder', { name: folderPath.split(/[\\/]/).pop() || folderPath }), 'success');
      return;
    }
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    const { failed, uploaded } = await uploadDroppedFiles(files);
    const tree = await fetchTree();
    dispatch({ type: 'SET_FILES', payload: tree.files });
    for (const serverPath of uploaded) {
      const file = findNodeByPath(tree.files, serverPath);
      if (file) await openFile(file);
    }
    if (failed.length > 0) {
      addToast(uploaded.length > 0
        ? tt('explorer.dropPartial', { failed: failed.length, uploaded: uploaded.length })
        : tt('explorer.dropFailed', { count: failed.length }), 'error');
      return;
    }
    addToast(uploaded.length === 1
      ? tt('explorer.droppedFile', { name: uploaded[0] })
      : tt('explorer.droppedFiles', { count: uploaded.length }), 'success');
  }, [addToast, dispatch, openFile, openFolderFromServer, tt]);

  if (!state.sidebarVisible || state.showSearchPanel || state.showSourceControl || state.showNpmScripts || state.showDebugPanel) return null;

  return (
    <SidebarPanel className={`sidebar${dropActive ? ' drop-active' : ''}`} width={panelWidth} onContextMenu={e => sidebarCtx.onCtx(e, null, null)} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      <SidebarHeader
        closeFolderTitle={tt('explorer.closeFolder')}
        fileCount={visibleFiles.length}
        onAddRoot={handleAddRoot}
        onCloseFolder={handleCloseFolder}
        onRefresh={loadFromServer}
        setInline={setInline}
        title={tt('explorer.title')}
        toggleFilter={() => setShowFilter(!showFilter)}
      />
      {showFilter && (
        <SidebarFilter
          filterRef={filterRef}
          placeholder={tt('explorer.filter')}
          value={filter}
          onChange={setFilter}
          onClear={() => setFilter('')}
        />
      )}
      <div className="sidebar-tree" onDragOver={e => { e.preventDefault(); }} onDrop={e => {
        e.preventDefault();
        if (sidebarDrag.hasDraggedNode()) {
          sidebarDrag.moveDraggedToRoot();
        }
      }}>
        {visibleFiles.length === 0 && !inline ? (
          <SidebarEmptyState
            emptyHint={tt('empty.hint')}
            onOpenFolder={handleOpenFolder}
            onOpenRecentProject={openFolderFromServer}
            openFolderLabel={tt('openFolder')}
            recentProjects={recentProjects}
            recentProjectsTitle={tt('sidebar.recentProjects')}
          />
        ) : (
          <>
            {renderTree(visibleFiles, 0)}
        {inline && inline.parentId === null && (
          <SidebarInlineInput
            inputRef={inlineRef}
            type={inline.type}
            value={inline.value}
            paddingLeft={10}
            tt={tt}
            onChange={value => setInline({ ...inline, value })}
            onSubmit={submitInline}
            onCancel={() => setInline(null)}
          />
        )}
          </>
        )}
      </div>
      <div className="sidebar-resizer ui-sidebar-resizer" ref={resizerRef} />

      {sidebarCtx.ctx && (
        <SidebarContextMenu
          ctx={sidebarCtx.ctx}
          tt={tt}
          onOpen={sidebarCtx.open}
          onRename={sidebarCtx.rename}
          onDelete={sidebarCtx.remove}
          onNewFile={sidebarCtx.newFile}
          onNewFolder={sidebarCtx.newFolder}
          onCopyPath={sidebarCtx.copyPath}
          onReveal={sidebarCtx.reveal}
        />
      )}
    </SidebarPanel>
  );
}
