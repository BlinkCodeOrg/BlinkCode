import { Search } from 'lucide-react';
import { useEditor } from '../../store/EditorContext';
import { useT } from '../../hooks/useT';
import './CommandCenter.css';

export default function CommandCenter() {
  const { state } = useEditor();
  const tt = useT();
  const workspace = state.workspaceDir.replace(/\\/g, '/').split('/').filter(Boolean).pop() || 'BlinkCode';

  return (
    <div className="command-center">
      <button className="command-center-main" onClick={() => window.dispatchEvent(new CustomEvent('blinkcode:openQuickOpen', { detail: { openQuickOpen: true } }))}>
        <Search size={14} />
        <span className="command-project">{workspace}</span>
        <span className="command-action">{tt('quickOpen.title')}</span>
        <kbd>{tt('shortcut.quickOpen')}</kbd>
      </button>
    </div>
  );
}
