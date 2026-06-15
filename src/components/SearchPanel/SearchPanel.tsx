import { useCallback, useMemo, useState } from 'react';
import { Replace, Search, X } from 'lucide-react';
import { useEditor } from '../../store/EditorContext';
import { replaceWorkspace, replaceWorkspaceMatch, searchWorkspaceStream, type WorkspaceSearchFileResult } from '../../utils/api';
import { useT } from '../../hooks/useT';
import { useHorizontalResize } from '../../hooks/useHorizontalResize';
import { findNodeByPath } from '../../features/workspaceTree/findNodeByPath';
import { SearchResults } from './SearchResults';
import { SidebarPanel } from '../ui/SidebarPanel';
import { useConfirmDialog } from '../ui/useConfirmDialog';
import { Input } from '../ui/Input';
import './SearchPanel.css';

export default function SearchPanel() {
  const { state, openFile, toggleSearchPanel, addToast, loadFromServer, updateSettings } = useEditor();
  const tt = useT();
  const panelWidth = state.settings.panelWidths.search;
  const resizerRef = useHorizontalResize(panelWidth, width => updateSettings({ panelWidths: { ...state.settings.panelWidths, search: width } }));
  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [include, setInclude] = useState('');
  const [exclude, setExclude] = useState('');
  const [regex, setRegex] = useState(false);
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [results, setResults] = useState<WorkspaceSearchFileResult[]>([]);
  const [total, setTotal] = useState(0);
  const [truncated, setTruncated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [engine, setEngine] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const confirmation = useConfirmDialog();

  const searchOptions = useMemo(() => ({
    query,
    regex,
    matchCase,
    wholeWord,
    include,
    exclude,
  }), [query, regex, matchCase, wholeWord, include, exclude]);

  const runSearch = useCallback(async () => {
    if (!query.trim()) {
      setResults([]);
      setTotal(0);
      setTruncated(false);
      return;
    }
    setLoading(true);
    setResults([]);
    setExpanded(new Set());
    try {
      const response = await searchWorkspaceStream(searchOptions, file => {
        setResults(previous => [...previous, file]);
        setExpanded(previous => new Set(previous).add(file.path));
      });
      setTotal(response.totalMatches);
      setTruncated(response.truncated);
      setEngine(response.engine || 'node');
    } catch (err: any) {
      addToast(err?.message || tt('search.failed'), 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, query, searchOptions, tt]);

  const openMatch = useCallback((path: string, line: number, column: number) => {
    const node = findNodeByPath(state.files, path);
    if (!node) {
      addToast(tt('search.fileNotFound'), 'error');
      return;
    }
    openFile(node);
    setTimeout(() => {
      const editor = (window as any).__blinkcodeEditor;
      if (!editor) return;
      editor.focus();
      editor.setPosition({ lineNumber: line, column });
      editor.revealLineInCenter(line);
    }, 150);
  }, [addToast, openFile, state.files, tt]);

  const toggleExpanded = (path: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const runReplaceAll = async () => {
    if (!query.trim()) return;
    const confirmed = await confirmation.confirm({
      cancelLabel: tt('common.cancel'),
      confirmLabel: tt('search.replaceAll'),
      danger: true,
      message: tt('search.replaceAllConfirm'),
      title: tt('search.replaceAll'),
    });
    if (!confirmed) return;
    setLoading(true);
    try {
      const response = await replaceWorkspace({ ...searchOptions, replacement });
      addToast(tt('search.replaced', { '0': response.totalReplacements }), 'success');
      await loadFromServer();
      await runSearch();
    } catch (err: any) {
      addToast(err?.message || tt('search.replaceFailed'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const runReplaceMatch = async (path: string, match: WorkspaceSearchFileResult['matches'][number]) => {
    try {
      await replaceWorkspaceMatch({
        path,
        line: match.line,
        column: match.column,
        length: match.length,
        expected: match.preview.slice(match.column - 1, match.column - 1 + match.length),
        replacement,
      });
      await loadFromServer();
      await runSearch();
      addToast(tt('search.replaced', { '0': 1 }), 'success');
    } catch (error: any) {
      addToast(error?.message || tt('search.replaceFailed'), 'error');
    }
  };

  if (!state.showSearchPanel) return null;

  return (
    <SidebarPanel className="search-panel" width={panelWidth}>
      {confirmation.dialog}
      <div className="search-panel-head ui-sidebar-panel-header">
        <div className="search-panel-title"><Search size={14} /> {tt('search.title')}</div>
        <button className="search-panel-close" onClick={toggleSearchPanel} title={tt('common.close')}><X size={14} /></button>
      </div>

      <div className="search-panel-controls">
        <div className="search-input-row">
          <Input
            className="search-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') runSearch(); }}
            placeholder={tt('search.placeholder')}
            spellCheck={false}
          />
          <button className={regex ? 'search-option active' : 'search-option'} onClick={() => setRegex(v => !v)} title={tt('search.regex')}>.*</button>
          <button className={matchCase ? 'search-option active' : 'search-option'} onClick={() => setMatchCase(v => !v)} title={tt('search.matchCase')}>Aa</button>
          <button className={wholeWord ? 'search-option active' : 'search-option'} onClick={() => setWholeWord(v => !v)} title={tt('search.wholeWord')}>ab</button>
          <button className="search-run-btn" onClick={runSearch} disabled={!query.trim() || loading} title={tt('search.run')}><Search size={14} /></button>
        </div>
        <div className="search-input-row">
          <Input
            className="search-input"
            value={replacement}
            onChange={e => setReplacement(e.target.value)}
            placeholder={tt('search.replacePlaceholder')}
            spellCheck={false}
          />
          <button className="search-replace-btn" onClick={runReplaceAll} disabled={!query.trim() || loading} title={tt('search.replaceAll')}><Replace size={14} /></button>
        </div>
        <Input className="search-filter-input" value={include} onChange={e => setInclude(e.target.value)} placeholder={tt('search.include')} spellCheck={false} />
        <Input className="search-filter-input" value={exclude} onChange={e => setExclude(e.target.value)} placeholder={tt('search.exclude')} spellCheck={false} />
      </div>

      <div className="search-summary">
        {loading ? tt('search.searching') : query.trim() ? tt('search.matches', { '0': total }) : tt('search.empty')}
        {truncated && <span className="search-truncated"> {tt('search.truncated')}</span>}
        {query.trim() && !loading && <span className="search-engine"> {engine}</span>}
      </div>

      <SearchResults results={results} expanded={expanded} onToggleExpanded={toggleExpanded} onOpenMatch={openMatch} onReplaceMatch={runReplaceMatch} />
      <div className="search-panel-resizer ui-sidebar-resizer" ref={resizerRef} />
    </SidebarPanel>
  );
}
