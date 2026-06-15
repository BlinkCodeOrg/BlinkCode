import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { fetchDebugVariables, type DebugScope, type DebugVariable } from '../../utils/api';
import { DebugVariableRow } from './DebugVariableRow';
import { useT } from '../../hooks/useT';

export function DebugVariables({ scope }: { scope: DebugScope }) {
  const tt = useT();
  const [open, setOpen] = useState(scope.type === 'local');
  const [variables, setVariables] = useState<DebugVariable[]>([]);

  useEffect(() => {
    if (!open || !scope.objectId) return;
    fetchDebugVariables(scope.objectId).then(setVariables).catch(() => setVariables([]));
  }, [open, scope.objectId]);

  return (
    <div className="debug-scope">
      <button type="button" onClick={() => setOpen(current => !current)}>
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <span>{scope.name}</span>
      </button>
      {open && (
        <div className="debug-variables">
          {variables.map(variable => <DebugVariableRow key={`${variable.name}:${variable.objectId || variable.value}`} variable={variable} />)}
          {variables.length === 0 && <span className="debug-empty-inline">{tt('debug.noVariables')}</span>}
        </div>
      )}
    </div>
  );
}
