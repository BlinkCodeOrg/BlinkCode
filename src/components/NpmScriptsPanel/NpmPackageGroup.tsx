import { ChevronDown, ChevronRight, Package } from 'lucide-react';
import type { TerminalInstance } from '../../types';
import type { NpmScriptPackage } from '../../utils/api';
import { NpmScriptRow } from './NpmScriptRow';

type NpmPackageGroupProps = {
  collapsed: boolean;
  npmPackage: NpmScriptPackage;
  terminals: TerminalInstance[];
  onFocus: (terminalId: string) => void;
  onRun: (npmPackage: NpmScriptPackage, scriptName: string) => void;
  onStop: (terminalId: string) => void;
  onToggle: () => void;
};

export function NpmPackageGroup({
  collapsed,
  npmPackage,
  terminals,
  onFocus,
  onRun,
  onStop,
  onToggle,
}: NpmPackageGroupProps) {
  return (
    <section
      className="npm-package-group"
      data-testid="npm-package-group"
      data-package-directory={npmPackage.directory}
    >
      <button type="button" className="npm-package-header" onClick={onToggle}>
        {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        <Package size={15} />
        <span className="npm-package-copy">
          <strong>{npmPackage.name}</strong>
          <small>{npmPackage.directory}</small>
        </span>
        <span className="npm-package-manager">{npmPackage.packageManager}</span>
      </button>
      <div className={`npm-package-scripts-reveal ${collapsed ? 'npm-package-scripts-collapsed' : ''}`}>
        <div className="npm-package-scripts">
          {npmPackage.scripts.map(script => {
            const scriptKey = `${npmPackage.directory}:${script.name}`;
            const terminal = [...terminals].reverse().find(item => item.scriptKey === scriptKey) || null;
            return (
              <NpmScriptRow
                key={script.name}
                script={script}
                terminal={terminal}
                onFocus={() => terminal && onFocus(terminal.id)}
                onRun={() => onRun(npmPackage, script.name)}
                onStop={() => terminal && onStop(terminal.id)}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
