import { RotateCcw, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useT } from '../../hooks/useT';

interface OutputEntry {
  id: number;
  text: string;
  tone: 'info' | 'error';
}

export function OutputView() {
  const tt = useT();
  const [entries, setEntries] = useState<OutputEntry[]>([]);
  useEffect(() => {
    let nextId = 0;
    const append = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      setEntries(current => [...current.slice(-499), {
        id: nextId++,
        text: String(detail?.message || detail || ''),
        tone: detail?.type === 'error' ? 'error' : 'info',
      }]);
    };
    window.addEventListener('blinkcode:output', append);
    window.addEventListener('blinkcode:extensionMessage', append);
    return () => {
      window.removeEventListener('blinkcode:output', append);
      window.removeEventListener('blinkcode:extensionMessage', append);
    };
  }, []);

  return (
    <div className="bottom-output">
      <div className="bottom-output-actions">
        <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('blinkcode:retryLastAction'))} title={tt('common.retry')}><RotateCcw size={13} /></button>
        <button type="button" onClick={() => setEntries([])} title={tt('common.clear')}><Trash2 size={13} /></button>
      </div>
      {entries.length === 0
        ? <div className="workbench-empty-state">{tt('bottomPanel.noOutput')}</div>
        : <pre>{entries.map(entry => <span className={`output-${entry.tone}`} key={entry.id}>{entry.text}{'\n'}</span>)}</pre>}
    </div>
  );
}
