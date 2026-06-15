import { BugPlay, Maximize2, Minimize2, PanelBottomClose, PanelRight, TerminalSquare, TriangleAlert, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useEditor } from '../../store/EditorContext';
import { useT } from '../../hooks/useT';
import TerminalPanel from '../Terminal/Terminal';
import ProblemsPanel from '../ProblemsPanel/ProblemsPanel';
import { DebugConsoleView } from './DebugConsoleView';
import { OutputView } from './OutputView';
import { useBottomPanelResize } from './useBottomPanelResize';
import './BottomPanel.css';

export default function BottomPanel() {
  const { state, dispatch, updateSettings } = useEditor();
  const tt = useT();
  const [counts, setCounts] = useState({ errors: 0, warnings: 0 });
  const { onBottomResizeStart, onRightResizeStart } = useBottomPanelResize({
    height: state.terminalHeight,
    width: state.settings.bottomPanelWidth,
    onHeightChange: height => dispatch({ type: 'SET_TERMINAL_HEIGHT', payload: { height } }),
    onWidthChange: bottomPanelWidth => updateSettings({ bottomPanelWidth }),
  });
  useEffect(() => {
    const update = (event: Event) => setCounts((event as CustomEvent).detail || { errors: 0, warnings: 0 });
    window.addEventListener('blinkcode:problemCounts', update);
    return () => window.removeEventListener('blinkcode:problemCounts', update);
  }, []);

  if (!state.bottomPanelOpen) return null;
  const select = (tab: typeof state.bottomPanelTab) => {
    dispatch({ type: 'SET_BOTTOM_PANEL_TAB', payload: { tab } });
    if (tab === 'terminal' && !state.terminalOpen) dispatch({ type: 'TOGGLE_TERMINAL' });
    if (tab === 'problems' && !state.showProblemsPanel) dispatch({ type: 'TOGGLE_PROBLEMS_PANEL' });
  };
  const close = () => {
    dispatch({ type: 'SET_BOTTOM_PANEL_OPEN', payload: { open: false } });
  };
  const tabs = [
    { id: 'terminal' as const, label: tt('top.terminal'), icon: TerminalSquare },
    { id: 'problems' as const, label: tt('problems.title'), icon: TriangleAlert, badge: counts.errors + counts.warnings },
    { id: 'output' as const, label: tt('bottomPanel.output'), icon: PanelBottomClose },
    { id: 'debugConsole' as const, label: tt('debug.console'), icon: BugPlay },
  ];

  return (
    <section
      className={`bottom-panel-shell bottom-panel-${state.settings.bottomPanelPosition} ${state.bottomPanelMaximized ? 'maximized' : ''}`}
      style={state.settings.bottomPanelPosition === 'bottom'
        ? { height: state.bottomPanelMaximized ? 'calc(100% - 64px)' : state.terminalHeight }
        : { width: state.bottomPanelMaximized ? 'calc(100% - 24px)' : state.settings.bottomPanelWidth }}
    >
      <div
        className={`bottom-panel-resizer bottom-panel-resizer-${state.settings.bottomPanelPosition}`}
        onPointerDown={state.settings.bottomPanelPosition === 'bottom' ? onBottomResizeStart : onRightResizeStart}
      />
      <header className="bottom-panel-header" onDoubleClick={() => dispatch({ type: 'TOGGLE_BOTTOM_PANEL_MAXIMIZED' })}>
        <nav>
          {tabs.map(tab => {
            const Icon = tab.icon;
            return <button key={tab.id} className={state.bottomPanelTab === tab.id ? 'active' : ''} onClick={() => select(tab.id)}><Icon size={13} />{tab.label}{!!tab.badge && <span>{tab.badge}</span>}</button>;
          })}
        </nav>
        <div className="bottom-panel-actions">
          <button onClick={() => updateSettings({ bottomPanelPosition: state.settings.bottomPanelPosition === 'bottom' ? 'right' : 'bottom' })} title={tt('settings.bottomPanelPosition')}><PanelRight size={13} /></button>
          <button onClick={() => dispatch({ type: 'TOGGLE_BOTTOM_PANEL_MAXIMIZED' })} title={tt('bottomPanel.maximize')}>{state.bottomPanelMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}</button>
          <button onClick={close} title={tt('common.close')}><X size={13} /></button>
        </div>
      </header>
      <div className="bottom-panel-content">
        <div className={`bottom-panel-view ${state.bottomPanelTab === 'terminal' ? 'active' : ''}`}>
          <TerminalPanel />
        </div>
        <div className={`bottom-panel-view ${state.bottomPanelTab === 'problems' ? 'active' : ''}`}>
          <ProblemsPanel />
        </div>
        <div className={`bottom-panel-view ${state.bottomPanelTab === 'output' ? 'active' : ''}`}>
          <OutputView />
        </div>
        <div className={`bottom-panel-view ${state.bottomPanelTab === 'debugConsole' ? 'active' : ''}`}>
          <DebugConsoleView />
        </div>
      </div>
    </section>
  );
}
