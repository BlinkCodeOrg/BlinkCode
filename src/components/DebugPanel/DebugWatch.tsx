import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { evaluateDebugExpression, type DebugVariable } from '../../utils/api';
import { Input } from '../ui/Input';
import { useT } from '../../hooks/useT';

const STORAGE_KEY = 'blinkcode-debug-watch';

export function DebugWatch({ callFrameId, paused }: { callFrameId?: string; paused: boolean }) {
  const tt = useT();
  const [expressions, setExpressions] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
  });
  const [draft, setDraft] = useState('');
  const [results, setResults] = useState<Record<string, DebugVariable | string>>({});

  useEffect(() => {
    if (!paused) {
      setResults({});
      return;
    }
    Promise.all(expressions.map(async expression => {
      try {
        return [expression, await evaluateDebugExpression(expression, callFrameId)] as const;
      } catch (error) {
        return [expression, error instanceof Error ? error.message : tt('debug.evaluationFailed')] as const;
      }
    })).then(entries => setResults(Object.fromEntries(entries)));
  }, [callFrameId, expressions, paused, tt]);

  const persist = (next: string[]) => {
    setExpressions(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };
  const add = () => {
    const expression = draft.trim();
    if (!expression || expressions.includes(expression)) return;
    persist([...expressions, expression]);
    setDraft('');
  };

  return (
    <div className="debug-watch">
      {expressions.map(expression => {
        const result = results[expression];
        return (
          <div className="debug-watch-row" key={expression}>
            <div>
              <strong>{expression}</strong>
              <span>{typeof result === 'string' ? result : String(result?.value ?? tt(paused ? 'debug.evaluating' : 'debug.notAvailable'))}</span>
            </div>
            <button type="button" onClick={() => persist(expressions.filter(item => item !== expression))} title={tt('debug.removeExpression')}>
              <Trash2 size={12} />
            </button>
          </div>
        );
      })}
      <form className="debug-watch-add" onSubmit={event => { event.preventDefault(); add(); }}>
        <Input value={draft} onChange={event => setDraft(event.target.value)} placeholder={tt('debug.watchPlaceholder')} aria-label={tt('debug.watchExpression')} />
        <button type="submit" disabled={!draft.trim()} title={tt('debug.addExpression')}><Plus size={13} /></button>
      </form>
    </div>
  );
}
