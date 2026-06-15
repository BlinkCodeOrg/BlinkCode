import { ArrowUpCircle, Trash2 } from 'lucide-react';
import type { OutdatedDependency, ProjectDependency } from '../../utils/api';
import { useT } from '../../hooks/useT';

type DependencyRowProps = {
  dependency: ProjectDependency;
  outdated: OutdatedDependency | null;
  onRemove: () => void;
  onUpdate: () => void;
};

export function DependencyRow({ dependency, outdated, onRemove, onUpdate }: DependencyRowProps) {
  const tt = useT();
  return (
    <div className="dependency-row" data-testid="dependency-row" data-dependency-name={dependency.name}>
      <div className="dependency-row-copy">
        <strong>{dependency.name}</strong>
        <small>
          {dependency.installedVersion || tt('dependencies.notInstalled')}
          <span> {tt('common.declared')} {dependency.declaredVersion}</span>
        </small>
      </div>
      <span className={`dependency-type dependency-type-${dependency.type}`}>{dependency.type}</span>
      {outdated?.latest && <span className="dependency-latest">{tt('common.latest')} {outdated.latest}</span>}
      <button type="button" className="npm-script-icon-button" onClick={onUpdate} title={tt('dependency.update')}>
        <ArrowUpCircle size={14} />
      </button>
      <button type="button" className="npm-script-icon-button dependency-remove" onClick={onRemove} title={tt('dependency.remove')}>
        <Trash2 size={14} />
      </button>
    </div>
  );
}
