import type { EditorAction, EditorState } from '../../types';
import { addFileToState } from './addFileToState';
import { closeTabInState } from './closeTabInState';
import { collapseAllNodes } from './collapseAllNodes';
import { deleteNodeFromState } from './deleteNodeFromState';
import { handleBrowserAction } from './handleBrowserAction';
import { handleFileSystemAction } from './handleFileSystemAction';
import { handleSidebarPanelAction } from './handleSidebarPanelAction';
import { handleTerminalAction } from './handleTerminalAction';
import { moveNodeInState } from './moveNodeInState';
import { openFileInState } from './openFileInState';
import { openVirtualPreviewInState } from './openVirtualPreviewInState';
import { openVirtualSettingsInState } from './openVirtualSettingsInState';
import { renameNodeInState } from './renameNodeInState';
import { restoreEditorState } from './restoreEditorState';
import { sortTree } from '../workspaceTree/sortTree';
import { updateNode } from '../workspaceTree/updateNode';
import { updateFileContentInState } from './updateFileContentInState';
import { updateSettingsInState } from './updateSettingsInState';
import { findNodeById } from '../workspaceTree/findNodeById';

export function reducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_FILES': return { ...state, files: sortTree(action.payload) };
    case 'CLOSE_FOLDER': return { ...state, files: [], openTabs: [], activeTabId: null, workspaceDir: '' };

    case 'OPEN_FILE': return openFileInState(state, action.payload.file);

    case 'CLOSE_TAB': return closeTabInState(state, action.payload.tabId);

    case 'SET_ACTIVE_TAB': {
      const tab = state.openTabs.find(item => item.id === action.payload.tabId);
      const file = tab ? findNodeById(state.files, tab.fileId) : null;
      return file?.extensionDetail
        ? { ...state, activeTabId: action.payload.tabId, splitActiveTabId: null, viewMode: 'editor' }
        : { ...state, activeTabId: action.payload.tabId };
    }

    case 'UPDATE_FILE_CONTENT': return updateFileContentInState(state, action.payload.fileId, action.payload.content, true);

    case 'SET_FILE_CONTENT': return updateFileContentInState(state, action.payload.fileId, action.payload.content, false);

    case 'SET_LARGE_FILE_PREVIEW':
      return {
        ...state,
        files: updateNode(state.files, action.payload.fileId, node => ({
          ...node,
          largePreviewContent: action.payload.content,
          largePreviewOffset: action.payload.offset,
          largePreviewDone: action.payload.done,
        })),
      };

    case 'MARK_FILE_SAVED': {
      const { fileId } = action.payload;
      return { ...state, files: updateNode(state.files, fileId, n => ({ ...n, dirty: false })), pendingCreate: null };
    }

    case 'SHOW_NEW_FILE': return { ...state, pendingCreate: action.payload };

    case 'CLEAR_PENDING_CREATE': return { ...state, pendingCreate: null };

    case 'TOGGLE_FOLDER': return { ...state, files: updateNode(state.files, action.payload.folderId, n => ({ ...n, isExpanded: !n.isExpanded })) };

    case 'ADD_FILE': return addFileToState(state, action.payload.parentId, action.payload.name, action.payload.type, action.payload.serverPath);

    case 'DELETE_NODE': return deleteNodeFromState(state, action.payload.nodeId);

    case 'RENAME_NODE': return renameNodeInState(state, action.payload.nodeId, action.payload.newName, action.payload.newServerPath);

    case 'MOVE_NODE': return moveNodeInState(state, action.payload.nodeId, action.payload.targetId, action.payload.position, action.payload.newServerPath);

    case 'SET_VIEW_MODE': return { ...state, viewMode: action.payload.mode };

    case 'OPEN_BROWSER_PREVIEW':
    case 'CLOSE_BROWSER_PREVIEW':
    case 'SET_BROWSER_URL':
    case 'SET_BROWSER_LOADING':
    case 'SET_BROWSER_NAV_STATE':
    case 'SET_BROWSER_ERROR':
      return handleBrowserAction(state, action);

    case 'TOGGLE_AI_PANEL': return { ...state, showAIPanel: !state.showAIPanel };

    case 'SET_SIDEBAR_WIDTH': return { ...state, sidebarWidth: Math.max(180, Math.min(420, action.payload.width)) };

    case 'ADD_TOAST': return { ...state, toasts: [...state.toasts, action.payload] };

    case 'REMOVE_TOAST': return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload.id) };

    case 'TOGGLE_SIDEBAR': return handleSidebarPanelAction(state, action);

    case 'REORDER_TABS': return { ...state, openTabs: action.payload.tabs };
    case 'TOGGLE_PIN_TAB':
      return {
        ...state,
        openTabs: state.openTabs.map(tab => tab.id === action.payload.tabId ? { ...tab, pinned: !tab.pinned } : tab),
      };
    case 'SET_BOTTOM_PANEL_TAB':
      return { ...state, bottomPanelTab: action.payload.tab, bottomPanelOpen: true };
    case 'SET_BOTTOM_PANEL_OPEN':
      return action.payload.open
        ? { ...state, bottomPanelOpen: true }
        : { ...state, bottomPanelOpen: false, terminalOpen: false, showProblemsPanel: false };
    case 'TOGGLE_BOTTOM_PANEL_MAXIMIZED':
      return { ...state, bottomPanelMaximized: !state.bottomPanelMaximized };

    case 'TOGGLE_TERMINAL':
    case 'SET_TERMINAL_HEIGHT':
    case 'ADD_TERMINAL_INSTANCE':
    case 'REMOVE_TERMINAL_INSTANCE':
    case 'SET_ACTIVE_TERMINAL':
    case 'UPDATE_TERMINAL_CWD':
    case 'SET_TERMINAL_STATUS':
    case 'ADD_TERMINAL_LINE':
    case 'CLEAR_TERMINAL':
      return handleTerminalAction(state, action);

    case 'COLLAPSE_ALL': return { ...state, files: collapseAllNodes(state.files) };

    case 'TOGGLE_SETTINGS': return { ...state, showSettings: !state.showSettings };
    case 'TOGGLE_SEARCH_PANEL':
    case 'TOGGLE_SOURCE_CONTROL':
    case 'TOGGLE_EXTENSIONS':
    case 'TOGGLE_NPM_SCRIPTS':
    case 'TOGGLE_DEBUG_PANEL':
      return handleSidebarPanelAction(state, action);
    case 'TOGGLE_PROBLEMS_PANEL': {
      const open = !state.showProblemsPanel || !state.bottomPanelOpen || state.bottomPanelTab !== 'problems';
      return { ...state, showProblemsPanel: open, bottomPanelOpen: open, bottomPanelTab: 'problems' };
    }
    case 'TOGGLE_ZEN_MODE': return { ...state, zenMode: !state.zenMode };

    case 'UPDATE_SETTINGS': return updateSettingsInState(state, action.payload);

    case 'OPEN_VIRTUAL_SETTINGS': return openVirtualSettingsInState(state, action.payload.node);

    case 'OPEN_DIFF_PREVIEW': return openVirtualPreviewInState(state, action.payload.node);

    case 'OPEN_MARKDOWN_PREVIEW': return openVirtualPreviewInState(state, action.payload.node, 'markdown');
    case 'OPEN_EXTENSION_DETAIL': {
      const next = openVirtualPreviewInState(state, action.payload.node, 'extension-detail');
      return { ...next, splitActiveTabId: null, viewMode: 'editor' };
    }

    case 'RESTORE_STATE': return restoreEditorState(state, action.payload);

    case 'SET_WORKSPACE_DIR': return { ...state, workspaceDir: action.payload };

    case 'SPLIT_TAB': {
      const tab = state.openTabs.find(t => t.id === action.payload.tabId);
      const file = tab ? findNodeById(state.files, tab.fileId) : null;
      if (file?.extensionDetail) return state;
      return { ...state, splitActiveTabId: tab ? tab.id : state.splitActiveTabId };
    }

    case 'SET_SPLIT_ACTIVE_TAB': {
      const tab = state.openTabs.find(item => item.id === action.payload.tabId);
      const file = tab ? findNodeById(state.files, tab.fileId) : null;
      return file?.extensionDetail ? state : { ...state, splitActiveTabId: action.payload.tabId };
    }

    case 'CLOSE_SPLIT_TAB': return { ...state, splitActiveTabId: null };

    case 'FS_ADD_NODE':
    case 'FS_REMOVE_NODE':
      return handleFileSystemAction(state, action);

    default: return state;
  }
}
