import type { EditorState, SavedEditorState } from '../../types';
import { findNodeById } from '../workspaceTree/findNodeById';
import { getExpandedFolders } from '../workspaceTree/getExpandedFolders';

export function getSaveableState(state: EditorState): SavedEditorState {
  const activeTab = state.openTabs.find(tab => tab.id === state.activeTabId);
  const activeFile = activeTab ? findNodeById(state.files, activeTab.fileId) : null;

  return {
    openTabs: state.openTabs.map(tab => {
      const file = findNodeById(state.files, tab.fileId);
      return {
        serverPath: file?.serverPath || '',
        name: tab.name,
        language: tab.language || '',
        isBinary: file?.binary || false,
        pinned: tab.pinned,
      };
    }).filter(tab => tab.serverPath && !tab.serverPath.startsWith('__')),
    activeTabServerPath: activeFile?.serverPath || null,
    splitActiveTabServerPath: (() => {
      if (!state.splitActiveTabId) return null;
      const tab = state.openTabs.find(item => item.id === state.splitActiveTabId);
      if (!tab) return null;
      const file = findNodeById(state.files, tab.fileId);
      return file?.serverPath || null;
    })(),
    sidebarWidth: state.sidebarWidth,
    sidebarVisible: state.sidebarVisible,
    terminalOpen: state.terminalOpen,
    terminalHeight: state.terminalHeight,
    bottomPanelTab: state.bottomPanelTab,
    bottomPanelOpen: state.bottomPanelOpen,
    viewMode: state.viewMode,
    showAIPanel: state.showAIPanel,
    zenMode: state.zenMode,
    settings: state.settings,
    expandedFolders: getExpandedFolders(state.files),
    folderClosed: state.files.length === 0,
    workspaceDir: state.workspaceDir,
  };
}
