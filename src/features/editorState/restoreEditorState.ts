import { v4 as uuid } from 'uuid';
import type { EditorState, Keybinding, SavedEditorState, Tab } from '../../types';
import { defaultSettings } from '../editorSettings/defaultSettings';
import { migrateKeybindings } from '../editorSettings/migrateKeybindings';
import { findNodeByPath } from '../workspaceTree/findNodeByPath';

export function restoreEditorState(state: EditorState, payload: SavedEditorState): EditorState {
  const next = { ...state };

  if (payload.settings) {
    next.settings = {
      ...next.settings,
      ...payload.settings,
      panelWidths: { ...next.settings.panelWidths, ...(payload.settings.panelWidths || {}) },
    };
    if (payload.settings.keybindings) {
      const merged = defaultSettings.keybindings.map(defaultKeybinding => {
        const savedKeybinding = payload.settings!.keybindings!.find((keybinding: Keybinding) => keybinding.id === defaultKeybinding.id);
        return savedKeybinding ? { ...defaultKeybinding, keys: savedKeybinding.keys } : defaultKeybinding;
      });
      next.settings.keybindings = migrateKeybindings(merged);
    }
  }

  if (payload.sidebarWidth !== undefined) next.sidebarWidth = payload.sidebarWidth;
  if (payload.sidebarVisible !== undefined) next.sidebarVisible = payload.sidebarVisible;
  if (payload.terminalOpen !== undefined) {
    next.terminalOpen = payload.terminalOpen;
    next.bottomPanelOpen = payload.bottomPanelOpen ?? payload.terminalOpen;
  }
  if (payload.terminalHeight !== undefined) next.terminalHeight = payload.terminalHeight;
  if (payload.bottomPanelTab !== undefined) next.bottomPanelTab = payload.bottomPanelTab;
  if (payload.viewMode !== undefined) next.viewMode = payload.viewMode;
  if (payload.showAIPanel !== undefined) next.showAIPanel = payload.showAIPanel;
  if (payload.zenMode !== undefined) next.zenMode = payload.zenMode;
  if (payload.workspaceDir !== undefined) next.workspaceDir = payload.workspaceDir;

  if (payload.expandedFolders) {
    const expandByPath = (nodes: typeof next.files): typeof next.files => nodes.map(node => ({
      ...node,
      isExpanded: node.type === 'folder' && node.serverPath ? payload.expandedFolders!.includes(node.serverPath) : node.isExpanded,
      children: node.children ? expandByPath(node.children) : undefined,
    }));
    next.files = expandByPath(next.files);
  }

  if (payload.openTabs && payload.openTabs.length > 0) {
    const tabs: Tab[] = [];
    for (const tabInfo of payload.openTabs) {
      const file = findNodeByPath(next.files, tabInfo.serverPath);
      if (file) {
        tabs.push({
          id: uuid(),
          fileId: file.id,
          name: file.name,
          language: file.language || tabInfo.language,
          pinned: Boolean((tabInfo as typeof tabInfo & { pinned?: boolean }).pinned),
        });
      }
    }
    next.openTabs = tabs;

    if (payload.activeTabServerPath) {
      const activeFile = findNodeByPath(next.files, payload.activeTabServerPath);
      if (activeFile) {
        const activeTab = tabs.find(tab => tab.fileId === activeFile.id);
        if (activeTab) next.activeTabId = activeTab.id;
      }
    }

    if (payload.splitActiveTabServerPath) {
      const splitFile = findNodeByPath(next.files, payload.splitActiveTabServerPath);
      if (splitFile) {
        const splitTab = tabs.find(tab => tab.fileId === splitFile.id);
        if (splitTab) {
          next.splitActiveTabId = splitTab.id;
          next.viewMode = 'split';
        }
      }
    }

    if (!next.activeTabId && tabs.length > 0) {
      next.activeTabId = tabs[0].id;
    }
  }

  return next;
}
