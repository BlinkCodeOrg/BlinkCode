import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { fetchDebugVariables, type DebugVariable } from '../../utils/api';

export function DebugVariableRow({ variable }: { variable: DebugVariable }) {
  const [open, setOpen] = useState(false);
  const [children, setChildren] = useState<DebugVariable[]>([]);
  const expandable = Boolean(variable.objectId);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && variable.objectId && !children.length) {
      setChildren(await fetchDebugVariables(variable.objectId).catch(() => []));
    }
  };

  return (
    <div className="debug-variable-tree">
      <div className="debug-variable">
        <button type="button" disabled={!expandable} onClick={toggle}>
          {expandable ? (open ? <ChevronDown size={11} /> : <ChevronRight size={11} />) : <span />}
        </button>
        <strong>{variable.name}</strong>
        <span>{String(variable.value)}</span>
        <small>{variable.type}</small>
      </div>
      {open && children.length > 0 && (
        <div className="debug-variable-children">
          {children.map(child => <DebugVariableRow key={`${child.name}:${child.objectId || child.value}`} variable={child} />)}
        </div>
      )}
    </div>
  );
}
