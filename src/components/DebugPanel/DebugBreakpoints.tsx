import { Trash2 } from 'lucide-react';
import type { DebugBreakpoint } from '../../utils/api';
import { Input } from '../ui/Input';
import { Checkbox } from '../ui/Checkbox';
import { useT } from '../../hooks/useT';

interface DebugBreakpointsProps {
  breakpoints: DebugBreakpoint[];
  onOpen: (path: string, line: number, column?: number) => void;
  onRemove: (id: string) => void;
  onConditionChange: (id: string, condition: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
}

export function DebugBreakpoints({ breakpoints, onConditionChange, onOpen, onRemove, onToggle }: DebugBreakpointsProps) {
  const tt = useT();
  if (!breakpoints.length) return <div className="debug-empty">{tt('debug.noBreakpoints')}</div>;
  return (
    <div className="debug-breakpoints">
      {breakpoints.map(breakpoint => (
        <div className="debug-breakpoint" key={breakpoint.id}>
          <Checkbox
            ariaLabel={tt(breakpoint.enabled ? 'debug.disableBreakpointAt' : 'debug.enableBreakpointAt', { path: breakpoint.path, line: breakpoint.line })}
            checked={breakpoint.enabled}
            className={breakpoint.verified === false ? 'debug-breakpoint-unverified' : ''}
            onChange={enabled => onToggle(breakpoint.id, enabled)}
            title={tt(breakpoint.enabled ? 'debug.disableBreakpoint' : 'debug.enableBreakpoint')}
          />
          <button type="button" className="debug-breakpoint-location" onClick={() => onOpen(breakpoint.path, breakpoint.line)}>
            <strong>{breakpoint.path.split('/').pop()}</strong>
            <span>{breakpoint.path}:{breakpoint.line}</span>
          </button>
          <button type="button" className="debug-row-action" onClick={() => onRemove(breakpoint.id)} title={tt('debug.removeBreakpoint')}>
            <Trash2 size={12} />
          </button>
          <Input
            aria-label={tt('debug.breakpointConditionAt', { path: breakpoint.path, line: breakpoint.line })}
            className="debug-breakpoint-condition"
            defaultValue={breakpoint.condition || ''}
            onBlur={event => onConditionChange(breakpoint.id, event.target.value.trim())}
            placeholder={tt('debug.conditionPlaceholder')}
          />
        </div>
      ))}
    </div>
  );
}
