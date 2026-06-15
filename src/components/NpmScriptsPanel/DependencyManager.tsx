import { useCallback, useEffect, useMemo, useState } from 'react';
import { PackagePlus, Search } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { useEditor } from '../../store/EditorContext';
import { useT } from '../../hooks/useT';
import {
  fetchDependencies,
  fetchOutdatedDependencies,
  type DependencyPackage,
  type DependencyType,
  type OutdatedDependency,
  type ProjectDependency,
} from '../../utils/api';
import { createDependencyCommand } from '../../features/dependencies/createDependencyCommand';
import { joinWorkspacePath } from '../../shared/path/joinWorkspacePath';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { useConfirmDialog } from '../ui/useConfirmDialog';
import { DependencyPackageGroup } from './DependencyPackageGroup';

type DependencyTypeFilter = DependencyType | 'all';

export function DependencyManager() {
  const { state, addTerminalInstance, addToast } = useEditor();
  const tt = useT();
  const [packages, setPackages] = useState<DependencyPackage[]>([]);
  const [query, setQuery] = useState('');
  const [newDependency, setNewDependency] = useState('');
  const [newDependencyType, setNewDependencyType] = useState<DependencyType>('production');
  const [selectedDirectory, setSelectedDirectory] = useState('.');
  const [packageFilter, setPackageFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<DependencyTypeFilter>('all');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [outdated, setOutdated] = useState<Record<string, Map<string, OutdatedDependency>>>({});
  const [checking, setChecking] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const confirmation = useConfirmDialog();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const nextPackages = await fetchDependencies();
      setPackages(nextPackages);
      setSelectedDirectory(current =>
        nextPackages.some(item => item.directory === current) ? current : nextPackages[0]?.directory || '.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : tt('dependencies.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [tt]);

  useEffect(() => { refresh(); }, [refresh, state.workspaceDir]);

  const filteredPackages = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return packages
      .filter(item => packageFilter === 'all' || item.directory === packageFilter)
      .map(item => ({
        ...item,
        dependencies: item.dependencies.filter(dependency =>
          (typeFilter === 'all' || dependency.type === typeFilter)
          && (
            !normalized
            || dependency.name.toLowerCase().includes(normalized)
            || dependency.declaredVersion.toLowerCase().includes(normalized)
            || dependency.installedVersion?.toLowerCase().includes(normalized)
            || dependency.type.includes(normalized)
          )),
      }))
      .filter(item => item.dependencies.length > 0);
  }, [packageFilter, packages, query, typeFilter]);

  const packageOptions = useMemo(() => [
    { value: 'all', label: tt('dependencies.allPackages') },
    ...packages.map(item => ({
      value: item.directory,
      label: item.directory === '.' ? item.name : `${item.name} (${item.directory})`,
    })),
  ], [packages, tt]);

  const typeFilterOptions = useMemo(() => [
    { value: 'all', label: tt('dependencies.allTypes') },
    { value: 'production', label: tt('dependencies.production') },
    { value: 'development', label: tt('dependencies.development') },
    { value: 'optional', label: tt('dependencies.optional') },
    { value: 'peer', label: tt('dependencies.peer') },
  ], [tt]);

  const installTypeOptions = useMemo(() => typeFilterOptions.filter(option => option.value !== 'all' && option.value !== 'peer'), [typeFilterOptions]);

  const runCommand = (dependencyPackage: DependencyPackage, command: string, label: string) => {
    const cwd = dependencyPackage.directory === '.'
      ? state.workspaceDir
      : joinWorkspacePath(state.workspaceDir, dependencyPackage.directory);
    addTerminalInstance({
      id: uuid(),
      name: label,
      cwd,
      startupCommand: command,
      status: 'starting',
    });
    addToast(`${tt('dependencies.started')}: ${label}`, 'info');
  };

  const mutateDependency = async (
    dependencyPackage: DependencyPackage,
    action: 'update' | 'remove',
    dependency: ProjectDependency,
  ) => {
    const prompt = action === 'remove'
      ? `${tt('dependencies.confirmRemove')} ${dependency.name}?`
      : `${tt('dependencies.confirmUpdate')} ${dependency.name}?`;
    const confirmed = await confirmation.confirm({
      cancelLabel: tt('common.cancel'),
      confirmLabel: action === 'remove' ? tt('dependencies.remove') : tt('dependencies.update'),
      danger: action === 'remove',
      message: prompt,
      title: action === 'remove' ? tt('dependencies.remove') : tt('dependencies.update'),
    });
    if (!confirmed) return;
    runCommand(
      dependencyPackage,
      createDependencyCommand(dependencyPackage.packageManager, action, dependency.name, dependency.type),
      `${action}: ${dependency.name}`,
    );
  };

  const installDependency = () => {
    const dependencyPackage = packages.find(item => item.directory === selectedDirectory);
    const name = newDependency.trim();
    if (!dependencyPackage || !name) return;
    runCommand(
      dependencyPackage,
      createDependencyCommand(dependencyPackage.packageManager, 'install', name, newDependencyType),
      `install: ${name}`,
    );
    setNewDependency('');
  };

  const checkUpdates = async (dependencyPackage: DependencyPackage) => {
    setChecking(current => new Set(current).add(dependencyPackage.directory));
    try {
      const result = await fetchOutdatedDependencies(dependencyPackage.directory);
      setOutdated(current => ({
        ...current,
        [dependencyPackage.directory]: new Map(result.outdated.map(item => [item.name, item])),
      }));
      if (result.warnings.length) {
        addToast(tt('dependencies.packageMissing'), 'info');
      } else {
        addToast(result.outdated.length ? tt('dependencies.updatesFound') : tt('dependencies.upToDate'), 'success');
      }
    } catch (reason) {
      addToast(reason instanceof Error ? reason.message : tt('dependencies.checkFailed'), 'error');
    } finally {
      setChecking(current => {
        const next = new Set(current);
        next.delete(dependencyPackage.directory);
        return next;
      });
    }
  };

  return (
    <>
      {confirmation.dialog}
      <label className="npm-scripts-search">
        <Search size={14} />
        <Input data-testid="dependency-search" value={query} onChange={event => setQuery(event.target.value)} placeholder={tt('dependencies.search')} />
      </label>
      <div className="dependency-filters">
        <div>
          <span>{tt('dependencies.packageFilter')}</span>
          <Select
            ariaLabel={tt('dependencies.packageFilter')}
            className="dependency-picker"
            options={packageOptions}
            testId="dependency-package-filter"
            value={packageFilter}
            onChange={value => setPackageFilter(String(value))}
          />
        </div>
        <div>
          <span>{tt('dependencies.typeFilter')}</span>
          <Select
            ariaLabel={tt('dependencies.typeFilter')}
            className="dependency-picker"
            options={typeFilterOptions}
            testId="dependency-type-filter"
            value={typeFilter}
            onChange={value => setTypeFilter(value as DependencyTypeFilter)}
          />
        </div>
      </div>
      <div className="dependency-add">
        <span className="dependency-add-label">{tt('dependencies.addTitle')}</span>
        <Select
          ariaLabel={tt('dependencies.package')}
          className="dependency-picker dependency-target-picker"
          options={packageOptions.filter(option => option.value !== 'all')}
          testId="dependency-target-picker"
          value={selectedDirectory}
          onChange={value => setSelectedDirectory(String(value))}
        />
        <div className="dependency-add-row">
          <Input value={newDependency} onChange={event => setNewDependency(event.target.value)} placeholder={tt('dependencies.addPlaceholder')} />
          <Select
            ariaLabel={tt('dependencies.installType')}
            className="dependency-picker dependency-install-type"
            options={installTypeOptions}
            testId="dependency-install-type"
            value={newDependencyType}
            onChange={value => setNewDependencyType(value as DependencyType)}
          />
          <button type="button" data-testid="dependency-install" onClick={installDependency} disabled={!newDependency.trim()}>
            <PackagePlus size={14} />
          </button>
        </div>
      </div><div className="npm-scripts-content">
        {loading && <div className="npm-scripts-state">{tt('dependencies.loading')}</div>}
        {!loading && error && <div className="npm-scripts-state npm-scripts-error">{error}</div>}
        {!loading && !error && filteredPackages.length === 0 && (
          <div className="npm-scripts-state">
            <PackagePlus size={28} />
            <strong>{query ? tt('npmScripts.noMatches') : tt('dependencies.empty')}</strong>
            <span>{query ? tt('npmScripts.noMatchesHint') : tt('dependencies.emptyHint')}</span>
          </div>
        )}
        {!loading && !error && filteredPackages.map(dependencyPackage => (
          <DependencyPackageGroup
            key={dependencyPackage.directory}
            collapsed={collapsed.has(dependencyPackage.directory)}
            dependencyPackage={dependencyPackage}
            outdated={outdated[dependencyPackage.directory] || new Map()}
            checking={checking.has(dependencyPackage.directory)}
            onCheckUpdates={() => checkUpdates(dependencyPackage)}
            onRemove={dependencyName => {
              const dependency = dependencyPackage.dependencies.find(item => item.name === dependencyName);
              if (dependency) mutateDependency(dependencyPackage, 'remove', dependency);
            }}
            onToggle={() => setCollapsed(current => {
              const next = new Set(current);
              if (next.has(dependencyPackage.directory)) next.delete(dependencyPackage.directory);
              else next.add(dependencyPackage.directory);
              return next;
            })}
            onUpdate={dependencyName => {
              const dependency = dependencyPackage.dependencies.find(item => item.name === dependencyName);
              if (dependency) mutateDependency(dependencyPackage, 'update', dependency);
            }}
          />
        ))}
      </div>
    </>
  );
}
