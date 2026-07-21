import { useState, useRef, useEffect, useCallback } from 'react';
import { useEditor } from '../../store/EditorContext';
import { useT } from '../../hooks/useT';
import { useHorizontalResize } from '../../hooks/useHorizontalResize';
import { closeWorkspace } from '../../utils/api';
import { openFolderFromPicker } from '../../features/sidebar/openFolderFromPicker';
import { useSidebarContextActions } from '../../features/sidebar/useSidebarContextActions';
import { useSidebarDragAndDrop } from '../../features/sidebar/useSidebarDragAndDrop';
import { useRecentProjects } from '../../features/sidebar/useRecentProjects';
import { SidebarContextMenu } from './SidebarContextMenu';
import { SidebarEmptyState } from './SidebarEmptyState';
import { SidebarFilter } from './SidebarFilter';
import { SidebarHeader } from './SidebarHeader';
import { SidebarInlineInput } from './SidebarInlineInput';
import { filterSidebarNode } from './filterSidebarNode';
import type { InlineInput } from './sidebarTypes';
import { SidebarPanel } from '../ui/SidebarPanel';
import { useExplorerGitDecorations } from '../../features/sidebar/useExplorerGitDecorations';
import { getDirtyFiles } from '../../features/dirtyFiles/getDirtyFiles';
import { addWorkspaceRootFromPicker } from '../../features/sidebar/addWorkspaceRootFromPicker';
import { useSidebarExternalDrop } from '../../features/sidebar/useSidebarExternalDrop';
import { SidebarTree } from './SidebarTree';
import './Sidebar.css';
export default function Sidebar() {
  const {
    state,
    openFile,
    toggleFolder,
    addFile,
    deleteNode,
    renameNode,
    moveNode,
    updateSettings,
    loadFromServer,
    addToast,
    dispatch,
    openFolderFromServer,
  } = useEditor();
  const tt = useT();
  const recentProjects = useRecentProjects(
    state.workspaceDir,
    state.files.length,
  );
  const gitDecorations = useExplorerGitDecorations(state.workspaceDir);
  const handleOpenFolder = useCallback(async () => {
    await openFolderFromPicker({
      addToast,
      dispatch,
      openFolderFromServer,
      tt,
    });
  }, [addToast, dispatch, openFolderFromServer, tt]);
  const handleCloseFolder = useCallback(async () => {
    if (getDirtyFiles(state.files).length > 0) {
      addToast(tt('explorer.dirtyCloseProject'), 'error');
      return;
    }
    dispatch({ type: 'CLOSE_FOLDER' });
    try {
      await closeWorkspace();
    } catch {}
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
  const sidebarDrag = useSidebarDragAndDrop({
    files: state.files,
    itemEls,
    moveNode,
  });
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
  const visibleFiles = state.files.filter((node) =>
    filterSidebarNode(node, filter),
  );
  const activeFileId = state.activeTabId
    ? state.openTabs.find((t) => t.id === state.activeTabId)?.fileId
    : null;

  useEffect(() => {
    if (inline) inlineRef.current?.focus();
  }, [inline]);
  useEffect(() => {
    if (state.pendingCreate) {
      setInline({ parentId: null, type: state.pendingCreate.type, value: '' });
      dispatch({ type: 'CLEAR_PENDING_CREATE' });
    }
  }, [dispatch, state.pendingCreate]);
  useEffect(() => {
    if (renamingId) {
      renameRef.current?.focus();
      renameRef.current?.select();
    }
  }, [renamingId]);
  useEffect(() => {
    if (showFilter) filterRef.current?.focus();
  }, [showFilter]);
  useEffect(() => {
    const h = () => sidebarCtx.closeCtx();
    window.addEventListener('click', h);
    return () => window.removeEventListener('click', h);
  }, [sidebarCtx]);

  const panelWidth = state.settings.panelWidths.explorer;
  const resizerRef = useHorizontalResize(panelWidth, (width) =>
    updateSettings({
      panelWidths: { ...state.settings.panelWidths, explorer: width },
    }),
  );

  const submitInline = () => {
    if (!inline) return;
    const v = inline.value.trim();
    if (v) addFile(inline.parentId, v, inline.type);
    setInline(null);
  };
  const submitRename = () => {
    if (renamingId && renameVal.trim())
      renameNode(renamingId, renameVal.trim());
    setRenamingId(null);
    setRenameVal('');
  };
  const externalDrop = useSidebarExternalDrop({ addToast, dispatch, openFile, openFolderFromServer, tt });
  if (
    !state.sidebarVisible ||
    state.showSearchPanel ||
    state.showSourceControl ||
    state.showNpmScripts ||
    state.showDebugPanel
  )
    return null;

  return (
    <SidebarPanel
      className={`sidebar${externalDrop.dropActive ? ' drop-active' : ''}`}
      width={panelWidth}
      onContextMenu={(e) => sidebarCtx.onCtx(e, null, null)}
      onDragOver={externalDrop.onDragOver}
      onDragLeave={externalDrop.onDragLeave}
      onDrop={externalDrop.onDrop}
    >
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
      <div
        className="sidebar-tree"
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (sidebarDrag.hasDraggedNode()) {
            sidebarDrag.moveDraggedToRoot();
          }
        }}
      >
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
            <SidebarTree
              nodes={visibleFiles}
              activeFileId={activeFileId}
              filter={filter}
              gitDecorations={gitDecorations as any}
              inline={inline}
              inlineRef={inlineRef}
              itemEls={itemEls}
              openFile={openFile}
              renameRef={renameRef}
              renameVal={renameVal}
              renamingId={renamingId}
              setInline={setInline}
              setRenameVal={setRenameVal}
              setRenamingId={setRenamingId}
              showFileIcons={state.settings.showFileIcons}
              sidebarCtx={sidebarCtx}
              sidebarDrag={sidebarDrag}
              submitInline={submitInline}
              submitRename={submitRename}
              toggleFolder={toggleFolder}
              tt={tt}
            />
            {inline && inline.parentId === null && (
              <SidebarInlineInput
                inputRef={inlineRef}
                type={inline.type}
                value={inline.value}
                paddingLeft={10}
                tt={tt}
                onChange={(value) => setInline({ ...inline, value })}
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
