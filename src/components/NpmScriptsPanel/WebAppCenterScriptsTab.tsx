import { Search, TerminalSquare } from 'lucide-react';
import type { TerminalInstance } from '../../types';
import type { NpmScriptPackage } from '../../utils/api';
import { Input } from '../ui/Input';
import { Skeleton } from '../ui/Skeleton';
import { ErrorState } from '../ui/ErrorState';
import { EmptyState } from '../ui/EmptyState';
import { NpmPackageGroup } from './NpmPackageGroup';

type TFn = (key: string) => string;

export function ScriptsTab({
  tt,
  query,
  loading,
  error,
  packages,
  terminals,
  collapsed,
  onQuery,
  onRetry,
  onFocus,
  onRun,
  onStop,
  onToggle,
}: {
  tt: TFn;
  query: string;
  loading: boolean;
  error: string;
  packages: NpmScriptPackage[];
  terminals: TerminalInstance[];
  collapsed: Set<string>;
  onQuery: (query: string) => void;
  onRetry: () => void;
  onFocus: (terminalId: string) => void;
  onRun: (npmPackage: NpmScriptPackage, scriptName: string) => void;
  onStop: (terminalId: string) => void;
  onToggle: (directory: string) => void;
}) {
  return (
    <>
      <label className="npm-scripts-search">
        <Search size={14} />
        <Input data-testid="npm-scripts-search" value={query} onChange={event => onQuery(event.target.value)} placeholder={tt('npmScripts.search')} />
      </label>
      <div className="npm-scripts-content">
        {loading && <Skeleton lines={6} />}
        {!loading && error && <ErrorState message={error} retryLabel={tt('common.retry')} onRetry={onRetry} />}
        {!loading && !error && packages.length === 0 && (
          <EmptyState icon={TerminalSquare} title={query ? tt('npmScripts.noMatches') : tt('npmScripts.empty')} description={query ? tt('npmScripts.noMatchesHint') : tt('npmScripts.emptyHint')} />
        )}
        {!loading && !error && packages.map(npmPackage => (
          <NpmPackageGroup
            key={npmPackage.directory}
            collapsed={collapsed.has(npmPackage.directory)}
            npmPackage={npmPackage}
            terminals={terminals}
            onFocus={onFocus}
            onRun={onRun}
            onStop={onStop}
            onToggle={() => onToggle(npmPackage.directory)}
          />
        ))}
      </div>
    </>
  );
}
