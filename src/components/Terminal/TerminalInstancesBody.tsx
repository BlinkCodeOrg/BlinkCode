import type { TerminalInstance } from '../../types';
import { TerminalInstanceView } from './TerminalInstanceView';

interface TerminalInstancesBodyProps {
  activeId: string | null;
  detectedLinks: Record<string, string[]>;
  instances: TerminalInstance[];
  placeholder: string;
  setHost: (id: string, host: HTMLDivElement | null) => void;
  onOpenPreview: (url: string) => void;
}

export function TerminalInstancesBody({
  activeId,
  detectedLinks,
  instances,
  onOpenPreview,
  placeholder,
  setHost,
}: TerminalInstancesBodyProps) {
  return (
    <div className="terminal-body">
      {instances.map(instance => (
        <TerminalInstanceView
          key={instance.id}
          activeId={activeId}
          detectedLinks={detectedLinks[instance.id] || []}
          instance={instance}
          onOpenPreview={onOpenPreview}
          placeholder={placeholder}
          setHost={setHost}
        />
      ))}
    </div>
  );
}
