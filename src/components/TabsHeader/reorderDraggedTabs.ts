import type { Tab } from '../../types';

export function reorderDraggedTabs(tabs: Tab[], draggedId: string, targetId: string): Tab[] {
  if (draggedId === targetId) return tabs;

  const fromIdx = tabs.findIndex(tab => tab.id === draggedId);
  const toIdx = tabs.findIndex(tab => tab.id === targetId);
  if (fromIdx === -1 || toIdx === -1) return tabs;

  const nextTabs = [...tabs];
  const [moved] = nextTabs.splice(fromIdx, 1);
  nextTabs.splice(toIdx, 0, moved);
  return nextTabs;
}
