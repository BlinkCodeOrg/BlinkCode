import type { EditorState } from '../../types';

export function closeTabInState(state: EditorState, tabId: string): EditorState {
  const idx = state.openTabs.findIndex(t => t.id === tabId);
  const targetTab = state.openTabs[idx];
  if (targetTab) {
    const isDirty = (nodes: typeof state.files): boolean => nodes.some(node => (
      node.id === targetTab.fileId ? Boolean(node.dirty) : Boolean(node.children && isDirty(node.children))
    ));
    if (isDirty(state.files)) return state;
  }
  const tabs = state.openTabs.filter(t => t.id !== tabId);
  let activeId = state.activeTabId;

  if (state.activeTabId === tabId) {
    if (tabs.length === 0) activeId = null;
    else if (idx >= tabs.length) activeId = tabs[tabs.length - 1].id;
    else activeId = tabs[idx]?.id || null;
  }

  const splitId = state.splitActiveTabId === tabId ? null : state.splitActiveTabId;
  return { ...state, openTabs: tabs, activeTabId: activeId, splitActiveTabId: splitId };
}
