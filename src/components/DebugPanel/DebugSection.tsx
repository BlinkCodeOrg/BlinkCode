import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useT } from '../../hooks/useT';
import { DebugPinToggle } from './DebugPinToggle';

interface DebugSectionProps {
  actions?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  title: string;
  sectionId?: string;
}

export function DebugSection({ actions, children, defaultOpen = true, sectionId, title }: DebugSectionProps) {
  const tt = useT();
  const [open, setOpen] = useState(defaultOpen);
  const storageKey = `blinkcode-debug-section-pinned:${sectionId || title}`;
  const [pinned, setPinned] = useState(() => {
    try { return localStorage.getItem(storageKey) === 'true'; } catch { return false; }
  });
  const togglePinned = () => {
    const next = !pinned;
    setPinned(next);
    if (next) setOpen(true);
    try { localStorage.setItem(storageKey, String(next)); } catch {}
  };
  return (
    <section className={`debug-section ${pinned ? 'debug-section-pinned' : ''}`}>
      <header className="debug-section-head">
        <button type="button" onClick={() => { if (!pinned) setOpen(current => !current); }}>
          {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          <span>{title}</span>
        </button>
        <div className="debug-section-actions">
          {actions}
          <DebugPinToggle
            pinned={pinned}
            title={tt(pinned ? 'debug.unpinSection' : 'debug.pinSection')}
            onClick={togglePinned}
          />
        </div>
      </header>
      {open && <div className="debug-section-body">{children}</div>}
    </section>
  );
}
