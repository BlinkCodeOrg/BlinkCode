import React, { createContext, useContext, useReducer, useCallback, useRef, type ReactNode } from 'react';
import type { FileNode, Tab, ToastItem, TerminalLine, TerminalInstance, EditorSettings } from '../types';
import { isSupportedWebFile } from '../utils/supportedWebFiles';
import {
  createFileOnServer, trashOnServer, renameOnServer, moveOnServer, openFolderOnServer,
} from '../utils/api';
import { findNodeById } from '../features/workspaceTree/findNodeById';
import { loadWorkspaceFromServer } from '../features/editorProvider/loadWorkspaceFromServer';
import { openFileForEditor } from '../features/editorProvider/openFileForEditor';
import { openSettingsJsonForEditor } from '../features/editorProvider/openSettingsJsonForEditor';
import { useDirtyFileAutosave } from '../features/editorProvider/useDirtyFileAutosave';
import { useEditorDomAttributes } from '../features/editorProvider/useEditorDomAttributes';
import { useFileSystemWatcher } from '../features/editorProvider/useFileSystemWatcher';
import { useEditorKeybindings } from '../features/editorProvider/useEditorKeybindings';
import { usePersistEditorState } from '../features/editorProvider/usePersistEditorState';
import { useRecoveryBuffers } from '../features/editorProvider/useRecoveryBuffers';
import { saveFileNode } from '../features/editorProvider/saveFileNode';
export { THEME_LIST, type ThemeName } from '../features/editorSettings/themeList';
import { v4 as uuid } from 'uuid';
import type { EditorContextValue } from './editorContextTypes';
import { initialState } from '../features/editorState/initialState';
import { reducer } from '../features/editorState/reducer';
import { recordRecentFile } from '../features/recentFiles/recentFiles';
import { getDirtyFiles } from '../features/dirtyFiles/getDirtyFiles';
import { useFilePersistenceActions } from '../features/editorProvider/useFilePersistenceActions';
import { t } from '../utils/i18n';
const EditorContext = createContext<EditorContextValue | null>(null);
export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { ...initialState, files: [] });
  const stateRef = useRef(state);
  stateRef.current = state;
  const tt = useCallback(
    (key: string, args?: Record<string, string | number>) => t(key, stateRef.current.settings.language, args),
    [],
  );
  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const editorRef = useRef<any>(null);
  const registerEditor = useCallback((editor: any) => {
    editorRef.current = editor;
    (window as any).__blinkcodeEditor = editor;
  }, []);
  const triggerEditorAction = useCallback((action: 'undo' | 'redo') => {
    if (editorRef.current) {
      editorRef.current.focus();
      editorRef.current.trigger('keyboard', action);
    }
  }, []);
  const openFile = useCallback(async (file: FileNode) => {
    if (file.serverPath) recordRecentFile(file.serverPath);
    await openFileForEditor(file, dispatch, stateRef.current.settings.language);
  }, []);
  const openDiffPreview = useCallback((node: FileNode) => {
    dispatch({ type: 'OPEN_DIFF_PREVIEW', payload: { node } });
  }, []);
  const openMarkdownPreview = useCallback((node: FileNode) => dispatch({ type: 'OPEN_MARKDOWN_PREVIEW', payload: { node } }), []);
  const openExtensionDetail = useCallback((node: FileNode) => dispatch({ type: 'OPEN_EXTENSION_DETAIL', payload: { node } }), []);
  const closeTab = useCallback((id: string) => dispatch({ type: 'CLOSE_TAB', payload: { tabId: id } }), []);
  const setActiveTab = useCallback((id: string) => dispatch({ type: 'SET_ACTIVE_TAB', payload: { tabId: id } }), []);
  const addToast = useCallback((msg: string, type: ToastItem['type']) => {
    const id = uuid();
    dispatch({ type: 'ADD_TOAST', payload: { id, message: msg, type } });
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: { id } }), 3000);
  }, []);

  const persistFileNode = useCallback((file: FileNode, content: string, settings: EditorSettings) => {
    const scheduled = saveTimers.current.get(file.id);
    if (scheduled) {
      clearTimeout(scheduled);
      saveTimers.current.delete(file.id);
    }
    return saveFileNode({
      file,
      content,
      settings,
      markSaved: fileId => dispatch({ type: 'MARK_FILE_SAVED', payload: { fileId } }),
      updateContent: (fileId, nextContent) => dispatch({ type: 'SET_FILE_CONTENT', payload: { fileId, content: nextContent } }),
      updateSettings: nextSettings => dispatch({ type: 'UPDATE_SETTINGS', payload: nextSettings }),
    });
  }, []);

  const { discardTabChanges, saveAllFiles, saveTab } = useFilePersistenceActions({
    addToast,
    dispatch,
    persistFileNode,
    saveTimers,
    stateRef,
  });

  const updateFileContent = useCallback((fid: string, c: string) => {
    React.startTransition(() => {
      dispatch({ type: 'UPDATE_FILE_CONTENT', payload: { fileId: fid, content: c } });
    });
    const file = findNodeById(state.files, fid);
    if (!file || state.settings.autoSaveDelay <= 0) return;
    const canSave = file.serverPath?.startsWith('__settings__/') || (file.serverPath && isSupportedWebFile(file.name));
    if (!canSave) return;

    if (saveTimers.current.has(fid)) clearTimeout(saveTimers.current.get(fid)!);
    saveTimers.current.set(fid, setTimeout(async () => {
      try {
        await persistFileNode({ ...file, content: c }, c, state.settings);
      } catch {}
      saveTimers.current.delete(fid);
    }, state.settings.autoSaveDelay));
  }, [persistFileNode, state.files, state.settings]);

  const toggleFolder = useCallback((id: string) => dispatch({ type: 'TOGGLE_FOLDER', payload: { folderId: id } }), []);

  const addFile = useCallback(async (parentId: string | null, n: string, t: 'file' | 'folder') => {
    const parent = parentId ? findNodeById(state.files, parentId) : null;
    const parentPath = parent?.serverPath || '';
    const sp = parentPath ? `${parentPath}/${n}` : n;

    try {
      await createFileOnServer(sp, t);
      dispatch({ type: 'ADD_FILE', payload: { parentId, name: n, type: t, serverPath: sp } });
    } catch (error) {
      addToast(tt('file.createFailed', { name: n, error: error instanceof Error ? error.message : tt('common.unknownError') }), 'error');
    }
  }, [addToast, state.files, tt]);

  const deleteNode = useCallback(async (nodeId: string) => {
    const node = findNodeById(state.files, nodeId);
    if (!node?.serverPath) return;
    try {
      await trashOnServer(node.serverPath, state.workspaceDir);
      dispatch({ type: 'DELETE_NODE', payload: { nodeId } });
    } catch (error) {
      console.error('[trash] failed:', node.serverPath, error);
      addToast(tt('trash.failed'), 'error');
    }
  }, [addToast, state.files, state.workspaceDir, tt]);

  const renameNode = useCallback(async (nodeId: string, newName: string) => {
    const node = findNodeById(state.files, nodeId);
    if (!node?.serverPath) return;
    try {
      const { newPath } = await renameOnServer(node.serverPath, newName);
      dispatch({ type: 'RENAME_NODE', payload: { nodeId, newName, newServerPath: newPath } });
    } catch (error) {
      addToast(tt('file.renameFailed', { name: node.name, error: error instanceof Error ? error.message : tt('common.unknownError') }), 'error');
    }
  }, [addToast, state.files, tt]);

  const moveNode = useCallback(async (nodeId: string, tid: string | null, pos: 'before' | 'after' | 'inside') => {
    const node = findNodeById(state.files, nodeId);
    const target = tid ? findNodeById(state.files, tid) : null;
    if (!node?.serverPath) return;
    try {
      const { newPath } = await moveOnServer(node.serverPath, target?.serverPath || null, pos);
      dispatch({ type: 'MOVE_NODE', payload: { nodeId, targetId: tid, position: pos, newServerPath: newPath } });
    } catch (error) {
      addToast(tt('file.moveFailed', { name: node.name, error: error instanceof Error ? error.message : tt('common.unknownError') }), 'error');
    }
  }, [addToast, state.files, tt]);

  const setViewMode = useCallback((m: 'editor' | 'split') => dispatch({ type: 'SET_VIEW_MODE', payload: { mode: m } }), []);
  const openBrowserPreview = useCallback((url: string) => dispatch({ type: 'OPEN_BROWSER_PREVIEW', payload: { url } }), []);
  const closeBrowserPreview = useCallback(() => dispatch({ type: 'CLOSE_BROWSER_PREVIEW' }), []);
  const setBrowserUrl = useCallback((url: string | null) => dispatch({ type: 'SET_BROWSER_URL', payload: { url } }), []);
  const setBrowserLoading = useCallback((loading: boolean) => dispatch({ type: 'SET_BROWSER_LOADING', payload: { loading } }), []);
  const setBrowserNavState = useCallback((canGoBack: boolean, canGoForward: boolean) => dispatch({ type: 'SET_BROWSER_NAV_STATE', payload: { canGoBack, canGoForward } }), []);
  const setBrowserError = useCallback((error: string | null) => dispatch({ type: 'SET_BROWSER_ERROR', payload: { error } }), []);
  const toggleAIPanel = useCallback(() => dispatch({ type: 'TOGGLE_AI_PANEL' }), []);
  const setSidebarWidth = useCallback((w: number) => dispatch({ type: 'SET_SIDEBAR_WIDTH', payload: { width: w } }), []);
  const removeToast = useCallback((id: string) => dispatch({ type: 'REMOVE_TOAST', payload: { id } }), []);
  const toggleSidebar = useCallback(() => dispatch({ type: 'TOGGLE_SIDEBAR' }), []);
  const getActiveFile = useCallback(() => {
    if (!state.activeTabId) return null;
    const tab = state.openTabs.find(t => t.id === state.activeTabId);
    if (!tab) return null;
    return findNodeById(state.files, tab.fileId);
  }, [state.activeTabId, state.openTabs, state.files]);
  const getSplitActiveFile = useCallback(() => {
    if (!state.splitActiveTabId) return null;
    const tab = state.openTabs.find(t => t.id === state.splitActiveTabId);
    if (!tab) return null;
    return findNodeById(state.files, tab.fileId);
  }, [state.splitActiveTabId, state.openTabs, state.files]);
  const splitTab = useCallback((tabId: string) => dispatch({ type: 'SPLIT_TAB', payload: { tabId } }), []);
  const closeSplitTab = useCallback(() => dispatch({ type: 'CLOSE_SPLIT_TAB' }), []);
  const setSplitActiveTab = useCallback((tabId: string | null) => dispatch({ type: 'SET_SPLIT_ACTIVE_TAB', payload: { tabId } }), []);
  const reorderTabs = useCallback((tabs: Tab[]) => dispatch({ type: 'REORDER_TABS', payload: { tabs } }), []);
  const toggleTerminal = useCallback(() => dispatch({ type: 'TOGGLE_TERMINAL' }), []);
  const setTerminalHeight = useCallback((h: number) => dispatch({ type: 'SET_TERMINAL_HEIGHT', payload: { height: h } }), []);
  const addTerminalInstance = useCallback((inst: TerminalInstance) => dispatch({ type: 'ADD_TERMINAL_INSTANCE', payload: inst }), []);
  const removeTerminalInstance = useCallback((id: string) => dispatch({ type: 'REMOVE_TERMINAL_INSTANCE', payload: { id } }), []);
  const setActiveTerminal = useCallback((id: string) => dispatch({ type: 'SET_ACTIVE_TERMINAL', payload: { id } }), []);
  const addTerminalLine = useCallback((_instanceId: string, _text: string, _type: TerminalLine['type']) => {
    // terminal output is now rendered directly by xterm session instances
  }, []);
  const updateTerminalCwd = useCallback((instanceId: string, cwd: string) => dispatch({ type: 'UPDATE_TERMINAL_CWD', payload: { instanceId, cwd } }), []);
  const setTerminalStatus = useCallback((instanceId: string, status: TerminalInstance['status'], exitCode?: number) => dispatch({ type: 'SET_TERMINAL_STATUS', payload: { instanceId, status, exitCode } }), []);
  const clearTerminal = useCallback((instanceId: string) => dispatch({ type: 'CLEAR_TERMINAL', payload: { instanceId } }), []);
  const collapseAll = useCallback(() => dispatch({ type: 'COLLAPSE_ALL' }), []);
  const toggleSettings = useCallback(() => dispatch({ type: 'TOGGLE_SETTINGS' }), []);
  const toggleSearchPanel = useCallback(() => dispatch({ type: 'TOGGLE_SEARCH_PANEL' }), []);
  const toggleSourceControl = useCallback(() => dispatch({ type: 'TOGGLE_SOURCE_CONTROL' }), []);
  const toggleExtensions = useCallback(() => dispatch({ type: 'TOGGLE_EXTENSIONS' }), []);
  const toggleNpmScripts = useCallback(() => dispatch({ type: 'TOGGLE_NPM_SCRIPTS' }), []);
  const toggleDebugPanel = useCallback(() => dispatch({ type: 'TOGGLE_DEBUG_PANEL' }), []);
  const toggleProblemsPanel = useCallback(() => dispatch({ type: 'TOGGLE_PROBLEMS_PANEL' }), []);
  const toggleZenMode = useCallback(() => dispatch({ type: 'TOGGLE_ZEN_MODE' }), []);
  const updateSettings = useCallback((s: Partial<EditorSettings>) => dispatch({ type: 'UPDATE_SETTINGS', payload: s }), []);

  const openSettingsJson = useCallback(async (scope: 'global' | 'workspace' = 'global') => {
    await openSettingsJsonForEditor(scope, state, dispatch);
  }, [state]);

  const loadFromServer = useCallback(async () => {
    await loadWorkspaceFromServer(dispatch);
  }, []);

  const openFolderFromServer = useCallback(async (dirPath: string) => {
    if (getDirtyFiles(stateRef.current.files).length > 0) {
      addToast(tt('explorer.dirtyOpenProject'), 'error');
      return;
    }
    try {
      const { files } = await openFolderOnServer(dirPath);
      dispatch({ type: 'SET_FILES', payload: files });
      dispatch({ type: 'SET_WORKSPACE_DIR', payload: dirPath });
    } catch (error) {
      addToast(tt('project.openFailed', { error: error instanceof Error ? error.message : tt('common.unknownError') }), 'error');
    }
  }, [addToast, tt]);

  React.useEffect(() => { loadFromServer(); }, [loadFromServer]);
  useEditorDomAttributes(state.settings);
  useDirtyFileAutosave(stateRef, saveTimers, persistFileNode, dispatch);
  usePersistEditorState(stateRef);
  useRecoveryBuffers(stateRef, state);
  useFileSystemWatcher(stateRef, dispatch);
  useEditorKeybindings({ dispatch, editorRef, persistFileNode, stateRef });

  return (
    <EditorContext.Provider value={{
      state, dispatch, openFile, closeTab, discardTabChanges, saveAllFiles, saveTab, setActiveTab, updateFileContent,
      toggleFolder, addFile, deleteNode, renameNode, moveNode,
      setViewMode, openBrowserPreview, closeBrowserPreview, setBrowserUrl,
      setBrowserLoading, setBrowserNavState, setBrowserError,
      toggleAIPanel, setSidebarWidth, addToast, removeToast,
      toggleSidebar, getActiveFile, getSplitActiveFile, splitTab, closeSplitTab, setSplitActiveTab, reorderTabs, toggleTerminal, setTerminalHeight,
      addTerminalInstance, removeTerminalInstance, setActiveTerminal,
      addTerminalLine, updateTerminalCwd, setTerminalStatus, clearTerminal, collapseAll,
      loadFromServer, openFolderFromServer,
      toggleSettings, toggleSearchPanel, toggleSourceControl, toggleExtensions, toggleNpmScripts, toggleDebugPanel, toggleProblemsPanel, toggleZenMode, updateSettings, openSettingsJson, openDiffPreview, openMarkdownPreview, openExtensionDetail, registerEditor, triggerEditorAction,
    }}>
      {children}
    </EditorContext.Provider>
  );
}
export function useEditor() {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditor must be within EditorProvider');
  return ctx;
}
