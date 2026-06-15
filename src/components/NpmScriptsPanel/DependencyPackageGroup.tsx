import { ChevronDown, ChevronRight, Package } from 'lucide-react';
import type { DependencyPackage, OutdatedDependency } from '../../utils/api';
import { DependencyRow } from './DependencyRow';

type DependencyPackageGroupProps = {
  collapsed: boolean;
  dependencyPackage: DependencyPackage;
  outdated: Map<string, OutdatedDependency>;
  checking: boolean;
  onCheckUpdates: () => void;
  onRemove: (dependencyName: string) => void;
  onToggle: () => void;
  onUpdate: (dependencyName: string) => void;
};

export function DependencyPackageGroup(props: DependencyPackageGroupProps) {
  const { collapsed, dependencyPackage, outdated, checking, onCheckUpdates, onRemove, onToggle, onUpdate } = props;
  return (
    <section className="npm-package-group" data-testid="dependency-package" data-package-directory={dependencyPackage.directory}>
      <div className="dependency-package-header">
        <button type="button" className="dependency-package-toggle" onClick={onToggle}>
          {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          <Package size={15} />
          <span className="npm-package-copy">
            <strong>{dependencyPackage.name}</strong>
            <small>{dependencyPackage.directory}</small>
          </span>
        </button>
        <button type="button" className="dependency-check" onClick={onCheckUpdates} disabled={checking}>
          {checking ? 'Checking...' : 'Check updates'}
        </button>
      </div>
      <div className={`npm-package-scripts-reveal ${collapsed ? 'npm-package-scripts-collapsed' : ''}`}>
        <div className="dependency-list">
          {dependencyPackage.dependencies.map(dependency => (
            <DependencyRow
              key={`${dependency.type}:${dependency.name}`}
              dependency={dependency}
              outdated={outdated.get(dependency.name) || null}
              onRemove={() => onRemove(dependency.name)}
              onUpdate={() => onUpdate(dependency.name)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
