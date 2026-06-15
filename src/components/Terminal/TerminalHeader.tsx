import { Terminal as TermIcon, X } from 'lucide-react';
import type { TerminalInstance } from '../../types';
import { TerminalTabs } from './TerminalTabs';
import { useT } from '../../hooks/useT';

interface TerminalHeaderProps {
  activeId: string | null;
  activeInstance: TerminalInstance | null;
  instances: TerminalInstance[];
  onActivate: (id: string) => void;
  onAdd: () => void;
  onClosePanel: () => void;
  onCloseTab: (id: string) => void;
  onReconnect: () => void;
}

export function TerminalHeader({
  activeId,
  activeInstance,
  instances,
  onActivate,
  onAdd,
  onClosePanel,
  onCloseTab,
  onReconnect,
}: TerminalHeaderProps) {
  const tt = useT();
  return (
    <div className="terminal-header">
      <div className="terminal-header-left">
        <TermIcon size={13} className="term-icon" />
        <TerminalTabs
          instances={instances}
          activeId={activeId}
          onActivate={onActivate}
          onClose={onCloseTab}
          onAdd={onAdd}
        />
      </div>
      <div className="terminal-header-right">
        {activeInstance && (
          <button className="term-action" onClick={onReconnect} title={tt('terminal.reconnect')}>
            <TermIcon size={13} />
          </button>
        )}
        <button className="term-action" onClick={onClosePanel} title={tt('terminal.closePanel')}>
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
