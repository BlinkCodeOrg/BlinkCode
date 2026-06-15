import { useEffect, useMemo, useState } from 'react';
import { Settings } from 'lucide-react';
import { useEditor } from '../../store/EditorContext';
import { useT } from '../../hooks/useT';
import type { ActivityBarItemId } from '../../types';
import { fetchGitStatus } from '../../utils/api';
import { ActivityBarItem } from './ActivityBarItem';
import { ActivityBarMenu } from './ActivityBarMenu';
import { ACTIVITY_BAR_ITEMS } from './activityBarItems';
import './ActivityBar.css';

export default function ActivityBar() {
  const {
    state,
    toggleSidebar,
    toggleSearchPanel,
    toggleSourceControl,
    toggleExtensions,
    toggleNpmScripts,
    toggleDebugPanel,
    toggleSettings,
    updateSettings,
  } = useEditor();
  const tt = useT();
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [gitChanges, setGitChanges] = useState(0);
  const [problems, setProblems] = useState(0);
  const [dragged, setDragged] = useState<ActivityBarItemId | null>(null);
  const actions: Record<ActivityBarItemId, () => void> = {
    explorer: toggleSidebar,
    search: toggleSearchPanel,
    sourceControl: toggleSourceControl,
    debug: toggleDebugPanel,
    extensions: toggleExtensions,
    npmScripts: toggleNpmScripts,
  };

  useEffect(() => {
    const refresh = () => fetchGitStatus()
      .then(status => setGitChanges(status.staged.length + status.unstaged.length + status.untracked.length))
      .catch(() => setGitChanges(0));
    refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('blinkcode:gitChanged', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('blinkcode:gitChanged', refresh);
    };
  }, [state.workspaceDir]);

  useEffect(() => {
    const update = (event: Event) => {
      const counts = (event as CustomEvent).detail;
      setProblems(Number(counts?.errors || 0) + Number(counts?.warnings || 0));
    };
    window.addEventListener('blinkcode:problemCounts', update);
    return () => window.removeEventListener('blinkcode:problemCounts', update);
  }, []);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [menu]);

  const labels = useMemo(() => Object.fromEntries(
    ACTIVITY_BAR_ITEMS.map(item => [item.id, tt(item.labelKey)]),
  ) as Record<ActivityBarItemId, string>, [tt]);
  const definitions = new Map(ACTIVITY_BAR_ITEMS.map(item => [item.id, item]));
  const ordered = state.settings.activityBarOrder
    .filter(id => !state.settings.hiddenActivityBarItems.includes(id))
    .map(id => definitions.get(id))
    .filter(Boolean) as typeof ACTIVITY_BAR_ITEMS;
  const badges: Partial<Record<ActivityBarItemId, number>> = {
    sourceControl: gitChanges,
    debug: problems,
    npmScripts: state.terminalInstances.filter(instance => instance.status === 'running').length,
  };

  const toggleVisibility = (id: ActivityBarItemId) => {
    const hidden = state.settings.hiddenActivityBarItems.includes(id)
      ? state.settings.hiddenActivityBarItems.filter(item => item !== id)
      : [...state.settings.hiddenActivityBarItems, id];
    updateSettings({ hiddenActivityBarItems: hidden });
    setMenu(null);
  };

  const moveBefore = (target: ActivityBarItemId) => {
    if (!dragged || dragged === target) return;
    const order = state.settings.activityBarOrder.filter(id => id !== dragged);
    order.splice(order.indexOf(target), 0, dragged);
    updateSettings({ activityBarOrder: order });
    setDragged(null);
  };

  return (
    <aside className="activity-bar" onContextMenu={event => { event.preventDefault(); setMenu({ x: event.clientX, y: event.clientY }); }}>
      <div className="activity-bar-top">
        {ordered.map(item => (
          <ActivityBarItem
            key={item.id}
            item={item}
            active={item.active(state)}
            badge={badges[item.id]}
            label={labels[item.id]}
            onClick={actions[item.id]}
            onContextMenu={event => { event.preventDefault(); setMenu({ x: event.clientX, y: event.clientY }); }}
            onDragStart={event => { setDragged(item.id); event.dataTransfer.effectAllowed = 'move'; }}
            onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }}
            onDrop={event => { event.preventDefault(); moveBefore(item.id); }}
          />
        ))}
      </div>
      <div className="activity-bar-bottom">
        <button className={`activity-btn activity-settings-btn ${state.showSettings ? 'active' : ''}`} data-testid="activity-settings" onClick={toggleSettings} title={tt('top.settings')}>
          <Settings size={21} strokeWidth={1.75} />
        </button>
      </div>
      {menu && (
        <ActivityBarMenu
          hidden={state.settings.hiddenActivityBarItems}
          labels={labels}
          x={menu.x}
          y={menu.y}
          onToggle={toggleVisibility}
        />
      )}
    </aside>
  );
}
