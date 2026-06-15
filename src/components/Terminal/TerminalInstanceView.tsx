import type { TerminalInstance } from '../../types';
import { TerminalLinks } from './TerminalLinks';

interface TerminalInstanceViewProps {
  activeId: string | null;
  detectedLinks: string[];
  instance: TerminalInstance;
  placeholder: string;
  setHost: (id: string, host: HTMLDivElement | null) => void;
  onOpenPreview: (url: string) => void;
}

export function TerminalInstanceView({
  activeId,
  detectedLinks,
  instance,
  onOpenPreview,
  placeholder,
  setHost,
}: TerminalInstanceViewProps) {
  return (
    <div
      className={`terminal-instance ${instance.id === activeId ? 'terminal-instance-active' : ''}`}
      data-testid="terminal-instance"
      data-terminal-status={instance.status || 'idle'}
      data-script-key={instance.scriptKey}
    >
      {detectedLinks.length > 0 && (
        <div className="term-status-row">
        <TerminalLinks urls={detectedLinks} onOpenPreview={onOpenPreview} />
        </div>
      )}
      <div
        ref={(el) => setHost(instance.id, el)}
        className="xterm-host"
        aria-label={placeholder}
      />
    </div>
  );
}
