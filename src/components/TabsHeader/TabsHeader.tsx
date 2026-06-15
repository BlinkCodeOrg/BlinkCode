import { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useEditor } from '../../store/EditorContext';
import { useT } from '../../hooks/useT';
import { isFileDirty } from '../../features/tabs/isFileDirty';
import { useTabMenuActions } from '../../features/tabs/useTabMenuActions';
import { reorderDraggedTabs } from './reorderDraggedTabs';
import { TabItem } from './TabItem';
import { TabContextMenu, type TabMenu } from './TabContextMenu';
import { useTabsMenuDismiss } from './useTabsMenuDismiss';
import { useExtensionFeature } from '../../features/extensions/ExtensionContext';
import './TabsHeader.css';

export default function TabsHeader() {
  const { state, dispatch, setActiveTab, closeTab, discardTabChanges, saveTab, reorderTabs, splitTab, openMarkdownPreview } = useEditor();
  const tt = useT();
  const markdownPreviewEnabled = useExtensionFeature('markdown-preview');
  const dragTab = useRef<string | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<TabMenu | null>(null);
  const [draggingTab, setDraggingTab] = useState<string | null>(null);

  const closeMenu = useCallback(() => setMenu(null), []);
  useTabsMenuDismiss(menu, closeMenu);
  const menuActions = useTabMenuActions({
    closeMenu,
    closeTab,
    discardTabChanges,
    menuTabId: menu?.tabId ?? null,
    openMarkdownPreview,
    splitTab,
    saveTab,
    state,
  });

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = tabsRef.current;
    if (!el) return;

    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (delta === 0) return;

    el.scrollLeft += delta;
    e.preventDefault();
  };

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, tabId: string) => {
    dragTab.current = tabId;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/x-blinkcode-tab', tabId);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!dragTab.current || dragTab.current === targetId) return;
    const tabs = reorderDraggedTabs(state.openTabs, dragTab.current, targetId);
    if (tabs === state.openTabs) return;
    reorderTabs(tabs);
  };

  const handleTabContextMenu = (e: React.MouseEvent, tabId: string, target: HTMLDivElement) => {
    e.preventDefault();
    const tab = state.openTabs.find(item => item.id === tabId);
    const file = tab ? state.files.find(node => node.id === tab.fileId) : null;
    if (file?.extensionDetail) {
      setMenu(null);
      return;
    }
    const rect = target.getBoundingClientRect();
    setMenu({ tabId, rect });
  };

  if (state.openTabs.length === 0) return null;

  return (
    <div className="tabs-header" ref={tabsRef} onWheel={handleWheel}>
      {state.openTabs.map(tab => {
        const isActive = tab.id === state.activeTabId;
        const dirty = isFileDirty(state.files, tab.fileId);
        const file = state.files.find(node => node.id === tab.fileId);
        const draggable = !file?.extensionDetail;
        return (
          <TabItem
            key={tab.id}
            active={isActive}
            dirty={dirty}
            tab={tab}
            draggable={draggable}
            iconDataUrl={file?.extensionDetail?.iconDataUrl}
            pinned={tab.pinned}
            dragging={draggingTab === tab.id}
            onActivate={() => { setMenu(null); setActiveTab(tab.id); }}
            onClose={e => { e.stopPropagation(); closeTab(tab.id); }}
            onContextMenu={e => handleTabContextMenu(e, tab.id, e.currentTarget)}
            onDragStart={event => { if (draggable) { setDraggingTab(tab.id); handleDragStart(event, tab.id); } }}
            onDragOver={e => handleDragOver(e, tab.id)}
            onDragEnd={() => { dragTab.current = null; setDraggingTab(null); }}
          />
        );
      })}
      {menu && createPortal(
        <TabContextMenu
          menu={menu}
          file={menuActions.getMenuFile()}
          tt={tt}
          onSave={menuActions.save}
          onDontSave={menuActions.dontSave}
          onCopyPath={menuActions.copyPath}
          onRevealInExplorer={menuActions.revealInExplorer}
          onMarkdownPreview={menuActions.markdownPreview}
          markdownPreviewEnabled={markdownPreviewEnabled}
          onSplit={menuActions.split}
          pinned={Boolean(state.openTabs.find(tab => tab.id === menu.tabId)?.pinned)}
          onTogglePin={() => { dispatch({ type: 'TOGGLE_PIN_TAB', payload: { tabId: menu.tabId } }); closeMenu(); }}
          onCloseOnly={menuActions.closeOnly}
          onCloseAll={menuActions.closeAll}
        />,
        document.body,
      )}
    </div>
  );
}
