import { useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { clearDebugOutput, evaluateDebugExpression, type DebugOutputLine } from '../../utils/api';
import { useDebugConsoleHistory } from '../../features/debugger/useDebugConsoleHistory';
import { Input } from '../ui/Input';
import { useT } from '../../hooks/useT';

interface DebugConsoleProps {
  callFrameId?: string;
  connected: boolean;
  output: DebugOutputLine[];
  onEvaluated: () => void;
}

export function DebugConsole({ callFrameId, connected, output, onEvaluated }: DebugConsoleProps) {
  const tt = useT();
  const [expression, setExpression] = useState('');
  const [error, setError] = useState('');
  const { handleKeyDown, record } = useDebugConsoleHistory(setExpression);
  const evaluate = async () => {
    const value = expression.trim();
    if (!value) return;
    try {
      setError('');
      await evaluateDebugExpression(value, callFrameId);
      record(value);
      setExpression('');
      onEvaluated();
    } catch (value) {
      setError(value instanceof Error ? value.message : tt('debug.evaluationFailed'));
    }
  };
  const clear = async () => {
    try {
      setError('');
      await clearDebugOutput();
      onEvaluated();
    } catch (value) {
      setError(value instanceof Error ? value.message : tt('debug.clearConsoleFailed'));
    }
  };

  return (
    <div className="debug-console">
      <div className="debug-console-actions">
        <button
          type="button"
          disabled={!output.length}
          onClick={clear}
          title={tt('debug.clearConsole')}
        >
          <Trash2 size={12} />
        </button>
      </div>
      <pre>{output.map((line, index) => <span className={`debug-output-${line.stream}`} key={index}>{line.text}</span>)}</pre>
      {error && <div className="debug-console-error">{error}</div>}
      <form onSubmit={event => { event.preventDefault(); evaluate(); }}>
        <span>&gt;</span>
        <Input
          aria-label={tt('debug.consoleExpression')}
          disabled={!connected}
          value={expression}
          onChange={event => setExpression(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tt(connected ? 'debug.evaluatePlaceholder' : 'debug.startToEvaluate')}
        />
        <button type="submit" disabled={!connected || !expression.trim()} title={tt('debug.evaluate')}><Send size={12} /></button>
      </form>
    </div>
  );
}
