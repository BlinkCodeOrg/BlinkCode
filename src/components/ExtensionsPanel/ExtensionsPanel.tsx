import { useMemo, useState } from 'react';
import { Blocks, RefreshCw, Search, X } from 'lucide-react';
import { useEditor } from '../../store/EditorContext';
import { useExtensions } from '../../features/extensions/ExtensionContext';
import { useHorizontalResize } from '../../hooks/useHorizontalResize';
import { useT } from '../../hooks/useT';
import { Input } from '../ui/Input';
import { SidebarPanel } from '../ui/SidebarPanel';
import { ExtensionCard } from './ExtensionCard';
import { createExtensionDetailNode } from '../../features/extensions/createExtensionDetailNode';
import './ExtensionsPanel.css';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import type { ExtensionOperation } from '../../features/apiClient/updateExtension';

type Filter = 'marketplace' | 'installed';

export default function ExtensionsPanel() {
  const { state, toggleExtensions, updateSettings, addToast, openExtensionDetail } = useEditor();
  const { busyId, error, extensions, refresh, update } = useExtensions();
  const [filter, setFilter] = useState<Filter>('marketplace');
  const [query, setQuery] = useState('');
  const tt = useT();
  const panelWidth = state.settings.panelWidths.extensions;
  const resizerRef = useHorizontalResize(panelWidth, width => updateSettings({ panelWidths: { ...state.settings.panelWidths, extensions: width } }));
  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return extensions.filter(extension => {
      if (filter === 'installed' && !extension.installed) return false;
      return !needle || `${extension.displayName} ${extension.description} ${extension.publisher}`
        .toLocaleLowerCase()
        .includes(needle);
    });
  }, [extensions, filter, query]);

  const changeExtension = async (id: string, operation: ExtensionOperation) => {
    try {
      await update(id, operation);
      addToast(tt(`extensions.${operation}Success`), 'success');
    } catch {
      addToast(tt('extensions.operationFailed'), 'error');
    }
  };

  return (
    <SidebarPanel className="extensions-panel" data-testid="extensions-panel" width={panelWidth}>
      <header className="extensions-header ui-sidebar-panel-header">
        <span><Blocks size={15} />{tt('extensions.title')}</span>
        <div>
          <button onClick={() => void refresh(true)} title={tt('common.refresh')}><RefreshCw size={14} /></button>
          <button onClick={toggleExtensions} title={tt('common.close')}><X size={14} /></button>
        </div>
      </header>
      <div className="extensions-search">
        <Search size={13} />
        <Input value={query} onChange={event => setQuery(event.target.value)} placeholder={tt('extensions.search')} spellCheck={false} />
      </div>
      <nav className="extensions-tabs">
        <button className={filter === 'marketplace' ? 'active' : ''} onClick={() => setFilter('marketplace')}>{tt('extensions.marketplace')}</button>
        <button className={filter === 'installed' ? 'active' : ''} onClick={() => setFilter('installed')}>{tt('extensions.installed')}</button>
      </nav>
      <div className="extensions-content">
        {error && <ErrorState message={error} retryLabel={tt('common.retry')} onRetry={() => void refresh()} />}
        {!error && visible.length === 0 && <EmptyState icon={Blocks} title={tt('extensions.empty')} />}
        {visible.map(extension => (
          <ExtensionCard
            key={extension.id}
            busy={busyId === extension.id}
            extension={extension}
            onOpen={item => openExtensionDetail(createExtensionDetailNode(item))}
            onUpdate={(id, operation) => void changeExtension(id, operation)}
            tt={tt}
          />
        ))}
      </div>
      <div className="ui-sidebar-resizer" ref={resizerRef} />
    </SidebarPanel>
  );
}
