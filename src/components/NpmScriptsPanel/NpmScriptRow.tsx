import { Play, RotateCcw, Square, TerminalSquare } from 'lucide-react';
import type { TerminalInstance } from '../../types';
import type { NpmScriptItem } from '../../utils/api';
import { useT } from '../../hooks/useT';

type NpmScriptRowProps = {
  script: NpmScriptItem;
  terminal: TerminalInstance | null;
  onFocus: () => void;
  onRun: () => void;
  onStop: () => void;
};

export function NpmScriptRow({ script, terminal, onFocus, onRun, onStop }: NpmScriptRowProps) {
  const tt = useT();
  const running = terminal?.status === 'starting' || terminal?.status === 'running';
  const scriptType = getScriptType(script.name);

  return (
    <div className={`npm-script-row npm-script-row-${scriptType}`} data-testid="npm-script-row" data-script-name={script.name}>
      <button type="button" className="npm-script-main" onClick={terminal ? onFocus : onRun} title={script.command}>
        <span className={`npm-script-status npm-script-status-${terminal?.status || 'idle'}`} />
        <span className="npm-script-copy">
          <strong><span>{script.name}</span><small className={`npm-script-kind npm-script-kind-${scriptType}`}>{scriptType}</small></strong>
          <small>{script.command}</small>
        </span>
      </button>
      <div className="npm-script-actions">
        {terminal && (
          <button type="button" className="npm-script-icon-button" onClick={onFocus} title={tt('terminal.open')}>
            <TerminalSquare size={15} />
          </button>
        )}
        {running ? (
          <button type="button" className="npm-script-icon-button npm-script-stop" data-testid="npm-script-stop" onClick={onStop} title={tt('terminal.stopScript')}>
            <Square size={14} />
          </button>
        ) : (
          <button type="button" className="npm-script-icon-button" data-testid="npm-script-run" onClick={onRun} title={tt(terminal ? 'npmScripts.runAgain' : 'npmScripts.run')}>
            {terminal ? <RotateCcw size={14} /> : <Play size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}

function getScriptType(name: string) {
  const normalized = name.toLowerCase();
  if (normalized === 'dev' || normalized.includes('dev') || normalized.includes('start')) return 'dev';
  if (normalized.includes('build')) return 'build';
  if (normalized.includes('test') || normalized.includes('spec')) return 'test';
  if (normalized.includes('lint') || normalized.includes('format') || normalized.includes('check')) return 'lint';
  if (normalized.includes('preview')) return 'preview';
  return 'run';
}
