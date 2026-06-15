import { BugPlay } from 'lucide-react';
import { useEditor } from '../../store/EditorContext';
import { useT } from '../../hooks/useT';

export function DebugConsoleView() {
  const { state, toggleDebugPanel } = useEditor();
  const tt = useT();
  return (
    <div className="workbench-empty-state bottom-debug-console">
      <BugPlay size={24} />
      <strong>{tt('debug.console')}</strong>
      <span>{tt('bottomPanel.debugConsoleHint')}</span>
      <button type="button" onClick={() => { if (!state.showDebugPanel) toggleDebugPanel(); }}>{tt('bottomPanel.openDebugger')}</button>
    </div>
  );
}
