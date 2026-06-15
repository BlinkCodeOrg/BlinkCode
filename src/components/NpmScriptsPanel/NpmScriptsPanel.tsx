import { useCallback, useEffect, useMemo, useState } from 'react';
import { PackageSearch, RefreshCw, Search, TerminalSquare } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { useEditor } from '../../store/EditorContext';
import { useT } from '../../hooks/useT';
import { createNpmRunCommand } from '../../features/npmScripts/createNpmRunCommand';
import { fetchNpmScripts, type NpmScriptPackage } from '../../utils/api';
import { joinWorkspacePath } from '../../shared/path/joinWorkspacePath';
import { NpmPackageGroup } from './NpmPackageGroup';
import { DependencyManager } from './DependencyManager';
import { SidebarPanel } from '../ui/SidebarPanel';
import { Input } from '../ui/Input';
import { useHorizontalResize } from '../../hooks/useHorizontalResize';
import './NpmScriptsPanel.css';
import { Skeleton } from '../ui/Skeleton';
import { ErrorState } from '../ui/ErrorState';
import { EmptyState } from '../ui/EmptyState';

export default function NpmScriptsPanel() {
  const { state, addTerminalInstance, setActiveTerminal, toggleTerminal, addToast, updateSettings } = useEditor();
  const tt = useT();
  const [packages, setPackages] = useState<NpmScriptPackage[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'scripts' | 'dependencies'>('scripts');
  const panelWidth = state.settings.panelWidths.npmScripts;
  const resizerRef = useHorizontalResize(panelWidth, width => updateSettings({ panelWidths: { ...state.settings.panelWidths, npmScripts: width } }));

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setPackages(await fetchNpmScripts());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : tt('npmScripts.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [tt]);

  useEffect(() => { refresh(); }, [refresh, state.workspaceDir]);

  const filteredPackages = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return packages;
    return packages
      .map(npmPackage => ({
        ...npmPackage,
        scripts: npmPackage.scripts.filter(script =>
          script.name.toLowerCase().includes(normalized)
          || script.command.toLowerCase().includes(normalized)
          || npmPackage.name.toLowerCase().includes(normalized)
        ),
      }))
      .filter(npmPackage => npmPackage.scripts.length > 0);
  }, [packages, query]);

  const focusTerminal = (terminalId: string) => {
    setActiveTerminal(terminalId);
    if (!state.terminalOpen) toggleTerminal();
  };

  const runScript = (npmPackage: NpmScriptPackage, scriptName: string) => {
    const id = uuid();
    const cwd = npmPackage.directory === '.'
      ? state.workspaceDir
      : joinWorkspacePath(state.workspaceDir, npmPackage.directory);
    addTerminalInstance({
      id,
      name: `${npmPackage.name}: ${scriptName}`,
      cwd,
      scriptKey: `${npmPackage.directory}:${scriptName}`,
      startupCommand: createNpmRunCommand(npmPackage.packageManager, scriptName),
      status: 'starting',
    });
    addToast(`${tt('npmScripts.started')}: ${scriptName}`, 'info');
  };

  const stopScript = (terminalId: string) => {
    window.dispatchEvent(new CustomEvent('blinkcode:stopTerminal', { detail: { terminalId } }));
  };

  return (
    <SidebarPanel
      className="npm-scripts-panel"
      data-testid="npm-scripts-panel"
      width={panelWidth}
    >
      <div className="npm-scripts-panel-inner">
        <header className="npm-scripts-header ui-sidebar-panel-header">
        <div>
          <span className="npm-scripts-eyebrow">{tt('npmScripts.workspace')}</span>
          <h2>{tt('npmScripts.title')}</h2>
        </div>
        <button type="button" className="npm-scripts-refresh" data-testid="npm-scripts-refresh" onClick={refresh} title={tt('npmScripts.refresh')} hidden={activeTab !== 'scripts'}>
          <RefreshCw size={15} className={loading ? 'npm-scripts-spin' : ''} />
        </button>
        </header>

        <div className="npm-panel-tabs">
          <button type="button" className={activeTab === 'scripts' ? 'active' : ''} onClick={() => setActiveTab('scripts')}>
            <TerminalSquare size={14} /> {tt('npmScripts.scriptsTab')}
          </button>
          <button type="button" data-testid="dependencies-tab" className={activeTab === 'dependencies' ? 'active' : ''} onClick={() => setActiveTab('dependencies')}>
            <PackageSearch size={14} /> {tt('dependencies.tab')}
          </button>
        </div>

        {activeTab === 'dependencies' ? <DependencyManager /> : (
          <>
          <label className="npm-scripts-search">
            <Search size={14} />
            <Input data-testid="npm-scripts-search" value={query} onChange={event => setQuery(event.target.value)} placeholder={tt('npmScripts.search')} />
          </label>
          <div className="npm-scripts-content">
          {loading && <Skeleton lines={6} />}
          {!loading && error && <ErrorState message={error} retryLabel={tt('common.retry')} onRetry={refresh} />}
          {!loading && !error && filteredPackages.length === 0 && (
            <EmptyState icon={TerminalSquare} title={query ? tt('npmScripts.noMatches') : tt('npmScripts.empty')} description={query ? tt('npmScripts.noMatchesHint') : tt('npmScripts.emptyHint')} />
          )}
          {!loading && !error && filteredPackages.map(npmPackage => (
            <NpmPackageGroup
              key={npmPackage.directory}
              collapsed={collapsed.has(npmPackage.directory)}
              npmPackage={npmPackage}
              terminals={state.terminalInstances}
              onFocus={focusTerminal}
              onRun={runScript}
              onStop={stopScript}
              onToggle={() => setCollapsed(current => {
                const next = new Set(current);
                if (next.has(npmPackage.directory)) next.delete(npmPackage.directory);
                else next.add(npmPackage.directory);
                return next;
              })}
            />
          ))}
          </div>
          </>
        )}
      </div>
      <div className="ui-sidebar-resizer" ref={resizerRef} />
    </SidebarPanel>
  );
}
