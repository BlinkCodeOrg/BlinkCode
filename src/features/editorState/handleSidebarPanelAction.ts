import type { EditorAction, EditorState } from '../../types';

type SidebarPanelAction = Extract<
  EditorAction,
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'TOGGLE_SEARCH_PANEL' }
  | { type: 'TOGGLE_SOURCE_CONTROL' }
  | { type: 'TOGGLE_EXTENSIONS' }
  | { type: 'TOGGLE_NPM_SCRIPTS' }
  | { type: 'TOGGLE_DEBUG_PANEL' }
>;

export function handleSidebarPanelAction(
  state: EditorState,
  action: SidebarPanelAction,
): EditorState {
  switch (action.type) {
    case 'TOGGLE_SIDEBAR':
      if (!state.sidebarVisible) {
        return {
          ...state,
          sidebarVisible: true,
          showSearchPanel: false,
          showSourceControl: false,
          showExtensions: false,
          showNpmScripts: false,
          showDebugPanel: false,
        };
      }
      if (state.showSearchPanel || state.showSourceControl || state.showExtensions || state.showNpmScripts || state.showDebugPanel) {
        return {
          ...state,
          sidebarVisible: true,
          showSearchPanel: false,
          showSourceControl: false,
          showExtensions: false,
          showNpmScripts: false,
          showDebugPanel: false,
        };
      }
      return { ...state, sidebarVisible: false };
    case 'TOGGLE_SEARCH_PANEL': {
      const next = !state.showSearchPanel;
      return {
        ...state,
        showSearchPanel: next,
        showSourceControl: false,
        showExtensions: false,
        showNpmScripts: false,
        showDebugPanel: false,
        sidebarVisible: true,
      };
    }
    case 'TOGGLE_SOURCE_CONTROL': {
      const next = !state.showSourceControl;
      return {
        ...state,
        showSourceControl: next,
        showExtensions: false,
        showSearchPanel: false,
        showNpmScripts: false,
        showDebugPanel: false,
        sidebarVisible: true,
      };
    }
    case 'TOGGLE_EXTENSIONS': {
      const next = !state.showExtensions;
      return {
        ...state,
        showExtensions: next,
        showSearchPanel: false,
        showSourceControl: false,
        showNpmScripts: false,
        showDebugPanel: false,
        sidebarVisible: true,
      };
    }
    case 'TOGGLE_NPM_SCRIPTS': {
      const next = !state.showNpmScripts;
      return {
        ...state,
        showNpmScripts: next,
        showSearchPanel: false,
        showSourceControl: false,
        showExtensions: false,
        showDebugPanel: false,
        sidebarVisible: true,
      };
    }
    case 'TOGGLE_DEBUG_PANEL': {
      const next = !state.showDebugPanel;
      return {
        ...state,
        showDebugPanel: next,
        showSearchPanel: false,
        showSourceControl: false,
        showExtensions: false,
        showNpmScripts: false,
        sidebarVisible: true,
      };
    }
  }
}
