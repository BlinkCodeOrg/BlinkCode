import { useMemo, useState, type KeyboardEvent } from 'react';
import { AlertTriangle, RotateCcw, Search } from 'lucide-react';
import type { Keybinding } from '../../types';
import { Input } from '../ui/Input';

export default function SettingsKeybindingsTab({
  keybindings,
  onRecordKey,
  onReset,
  recordingId,
  setRecordingId,
  tt,
}: {
  keybindings: Keybinding[];
  onRecordKey: (event: KeyboardEvent, id: string) => void;
  onReset: () => void;
  recordingId: string | null;
  setRecordingId: (id: string | null) => void;
  tt: (key: string) => string;
}) {
  const [query, setQuery] = useState('');
  const conflicts = useMemo(() => {
    const counts = new Map<string, number>();
    keybindings.forEach(binding => counts.set(binding.keys, (counts.get(binding.keys) || 0) + 1));
    return counts;
  }, [keybindings]);
  const visibleBindings = keybindings.filter(binding => {
    const normalized = query.trim().toLowerCase();
    return !normalized
      || binding.keys.toLowerCase().includes(normalized)
      || tt(`kb.${binding.id}`).toLowerCase().includes(normalized);
  });

  return (
    <div className="settings-section">
      <div className="keybindings-header">
        <div>
          <div className="settings-section-title">{tt('settings.keyboard')}</div>
        </div>
        <button className="keybindings-reset" onClick={onReset} title={tt('settings.resetDefaults')}>
          <RotateCcw size={12} />
          <span>{tt('settings.reset')}</span>
        </button>
      </div>
      <label className="keybindings-search">
        <Search size={14} />
        <Input value={query} onChange={event => setQuery(event.target.value)} placeholder={tt('settings.searchKeybindings')} />
      </label>
      {visibleBindings.map(kb => {
        const conflict = (conflicts.get(kb.keys) || 0) > 1;
        return (
        <div key={kb.id} className={`settings-row kb-row ${conflict ? 'kb-row-conflict' : ''}`}>
          <div className="settings-row-label">
            <span>{tt(`kb.${kb.id}`)}</span>
            {conflict && <small className="kb-conflict"><AlertTriangle size={11} /> {tt('settings.keybindingConflict')}</small>}
          </div>
          <div className="settings-row-control">
            {recordingId === kb.id ? (
              <button
                className="kb-record active"
                data-testid="keybinding-recorder"
                data-keybinding-id={kb.id}
                data-keybinding-recording="true"
                onKeyDown={event => onRecordKey(event, kb.id)}
                autoFocus
              >
                {tt('settings.pressKeys')}
              </button>
            ) : (
              <button
                className="kb-record"
                data-testid="keybinding-recorder"
                data-keybinding-id={kb.id}
                onClick={() => setRecordingId(kb.id)}
              >
                <kbd>{kb.keys}</kbd>
              </button>
            )}
          </div>
        </div>
      )})}
    </div>
  );
}
