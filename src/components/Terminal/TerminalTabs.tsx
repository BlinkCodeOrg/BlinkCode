import { Plus, X } from 'lucide-react';
import type { TerminalInstance } from '../../types';
import { useT } from '../../hooks/useT';

type TerminalTabsProps = {
  instances: TerminalInstance[];
  activeId: string | null;
  onActivate: (id: string) => void;
  onClose: (id: string) => void;
  onAdd: () => void;
};

export function TerminalTabs({ instances, activeId, onActivate, onClose, onAdd }: TerminalTabsProps) {
  const tt = useT();
  return (
    <div className="terminal-tabs">
      {instances.map(inst => (
        <div
          key={inst.id}
          className={`term-tab ${inst.id === activeId ? 'active' : ''}`}
          onClick={() => onActivate(inst.id)}
        >
          <span className="term-tab-name">{inst.name}</span>
          <button className="term-tab-close" onClick={e => { e.stopPropagation(); onClose(inst.id); }} title={tt('terminal.close')}>
            <X size={12} />
          </button>
        </div>
      ))}
      <button className="term-tab-add" onClick={onAdd} title={tt('terminal.new')}>
        <Plus size={16} />
      </button>
    </div>
  );
}
