import { ArrowDownToLine, ArrowUpFromLine, CirclePause, CirclePlay, Octagon, RotateCcw, StepForward } from 'lucide-react';
import type { DebugCommand, DebugStatus } from '../../utils/api';
import { useT } from '../../hooks/useT';

interface DebugToolbarProps {
  status: DebugStatus;
  connected: boolean;
  onCommand: (command: DebugCommand) => void;
}

export function DebugToolbar({ status, connected, onCommand }: DebugToolbarProps) {
  const tt = useT();
  const paused = status === 'paused';
  const canControl = connected && ['running', 'paused'].includes(status);
  const canStop = ['starting', 'running', 'paused'].includes(status);
  return (
    <div className="debug-toolbar">
      <button type="button" disabled={!canControl} onClick={() => onCommand(paused ? 'continue' : 'pause')} title={tt(paused ? 'debug.continue' : 'debug.pause')}>
        {paused ? <CirclePlay size={16} /> : <CirclePause size={16} />}
      </button>
      <button type="button" disabled={!paused} onClick={() => onCommand('stepOver')} title={tt('debug.stepOver')}><StepForward size={16} /></button>
      <button type="button" disabled={!paused} onClick={() => onCommand('stepInto')} title={tt('debug.stepInto')}><ArrowDownToLine size={16} /></button>
      <button type="button" disabled={!paused} onClick={() => onCommand('stepOut')} title={tt('debug.stepOut')}><ArrowUpFromLine size={16} /></button>
      <button type="button" disabled={!canStop} onClick={() => onCommand('restart')} title={tt('debug.restart')}><RotateCcw size={14} /></button>
      <button type="button" disabled={!canStop} onClick={() => onCommand('stop')} title={tt('debug.stop')}><Octagon size={15} /></button>
    </div>
  );
}
