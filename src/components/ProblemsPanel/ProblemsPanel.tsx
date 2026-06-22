import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { loader } from '@monaco-editor/react';
import { useEditor } from '../../store/EditorContext';
import { findNodeByPath } from '../../features/workspaceTree/findNodeByPath';
import { buildProblemGroups } from '../../features/problems/buildProblemGroups';
import type { DiagnosticItem, FileGroup } from '../../features/problems/problemTypes';
import { useT } from '../../hooks/useT';
import { ProblemFileGroup } from './ProblemFileGroup';
import './ProblemsPanel.css';
import { useResizable } from '../../hooks/useResizable';
import { limitProblemGroups } from '../../features/problems/limitProblemGroups';

const PROBLEM_PAGE_SIZE = 250;

export default function ProblemsPanel() {
  const { state, openFile, dispatch, addToast } = useEditor();
  const tt = useT();
  const [groups, setGroups] = useState<FileGroup[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [counts, setCounts] = useState({ errors: 0, warnings: 0, infos: 0 });
  const [filter, setFilter] = useState<'all' | 'errors' | 'warnings'>('all');
  const diagnosticsRef = useRef<Map<string, any[]>>(new Map());
  const monacoRef = useRef<any>(null);
  const expandedRef = useRef(expanded);
  const resizeRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [visibleLimit, setVisibleLimit] = useState(PROBLEM_PAGE_SIZE);
  const collectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  expandedRef.current = expanded;

  const collectDiagnostics = useCallback(() => {
    const allMarkers: any[] = monacoRef.current?.editor?.getModelMarkers?.({}) || [];
    for (const [uri, diagnostics] of diagnosticsRef.current) {
      for (const diagnostic of diagnostics) {
        allMarkers.push({ ...diagnostic, resource: { toString: () => uri } });
      }
    }
    const { groups: sorted, counts: nextCounts } = buildProblemGroups(allMarkers, state.workspaceDir);

    setGroups(sorted);
    setCounts(nextCounts);

    if (expandedRef.current.size === 0 && sorted.length > 0) {
      setExpanded(new Set(sorted.map(g => g.relPath)));
    }
  }, [state.workspaceDir]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (!detail?.uri) return;
      diagnosticsRef.current.set(detail.uri, detail.diagnostics || []);
      if (collectTimerRef.current) clearTimeout(collectTimerRef.current);
      collectTimerRef.current = setTimeout(collectDiagnostics, 120);
    };
    window.addEventListener('blinkcode:lspDiagnostics', handler);
    collectDiagnostics();
    return () => {
      if (collectTimerRef.current) clearTimeout(collectTimerRef.current);
      window.removeEventListener('blinkcode:lspDiagnostics', handler);
    };
  }, [collectDiagnostics]);

  useEffect(() => {
    let disposed = false;
    let disposable: any = null;
    loader.init().then(monaco => {
      if (disposed) return;
      monacoRef.current = monaco;
      collectDiagnostics();
      try {
        disposable = monaco.editor.onDidChangeMarkers(() => {
          if (collectTimerRef.current) clearTimeout(collectTimerRef.current);
          collectTimerRef.current = setTimeout(collectDiagnostics, 120);
        });
      } catch {}
    });
    return () => {
      disposed = true;
      try { disposable?.dispose?.(); } catch {}
    };
  }, [collectDiagnostics]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('blinkcode:problemCounts', { detail: counts }));
  }, [counts]);

  const toggleExpand = (path: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const goToProblem = useCallback((item: DiagnosticItem) => {
    const node = findNodeByPath(state.files, item.relPath);
    if (node) openFile(node);
    setTimeout(() => {
      const editor = (window as any).__blinkcodeEditor;
      if (!editor) return;
      editor.focus();
      editor.setPosition({ lineNumber: item.startLineNumber, column: item.startColumn });
      editor.revealLineInCenter(item.startLineNumber);
    }, 150);
  }, [openFile, state.files]);

  useEffect(() => {
    setVisibleLimit(PROBLEM_PAGE_SIZE);
    setSelectedIndex(0);
  }, [filter, groups]);

  const filteredGroups = useMemo(() => filter === 'all' ? groups : groups.map(g => ({
    ...g,
    items: g.items.filter(i =>
      filter === 'errors' ? i.severity === 8 : i.severity === 4,
    ),
  })).filter(g => g.items.length > 0), [filter, groups]);
  const totalFiltered = useMemo(
    () => filteredGroups.reduce((total, group) => total + group.items.length, 0),
    [filteredGroups],
  );
  const visibleGroups = useMemo(
    () => limitProblemGroups(filteredGroups, visibleLimit),
    [filteredGroups, visibleLimit],
  );

  const close = () => dispatch({ type: 'TOGGLE_PROBLEMS_PANEL' });
  const flatItems = useMemo(() => visibleGroups.flatMap(group => group.items), [visibleGroups]);

  const handleResize = useCallback((event: MouseEvent) => {
    const parent = resizeRef.current?.parentElement?.parentElement?.getBoundingClientRect();
    if (parent) dispatch({ type: 'SET_TERMINAL_HEIGHT', payload: { height: parent.bottom - event.clientY } });
  }, [dispatch]);
  useResizable(resizeRef, handleResize, 'row');

  const applyQuickFix = useCallback((item: DiagnosticItem) => {
    goToProblem(item);
    setTimeout(() => {
      const editor = (window as any).__blinkcodeEditor;
      editor?.getAction?.('editor.action.quickFix')?.run?.();
    }, 220);
  }, [goToProblem]);
  const copyProblem = useCallback((item: DiagnosticItem) => {
    const text = `${item.relPath}:${item.startLineNumber}:${item.startColumn} ${item.message}`;
    void navigator.clipboard?.writeText(text);
    addToast(tt('problems.copied'), 'success');
  }, [addToast, tt]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!flatItems.length) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      const next = Math.max(0, Math.min(flatItems.length - 1, selectedIndex + delta));
      setSelectedIndex(next);
      const items = document.querySelectorAll<HTMLButtonElement>('.problems-item');
      items[next]?.focus();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      goToProblem(flatItems[selectedIndex]);
    }
  };

  if (!state.showProblemsPanel) return null;

  return (
    <div className="problems-panel" style={{ height: state.terminalHeight }}>
      <div className="problems-resizer" ref={resizeRef} />
      <div className="problems-header">
        <div className="problems-header-left">
          <span className="problems-title">{tt('problems.title')}</span>
          <span className="problems-badge problems-badge-error">{counts.errors}</span>
          <span className="problems-badge problems-badge-warning">{counts.warnings}</span>
          <span className="problems-badge problems-badge-info">{counts.infos}</span>
        </div>
        <div className="problems-header-right">
          <button className={`problems-filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>{tt('problems.all')}</button>
          <button className={`problems-filter-btn ${filter === 'errors' ? 'active' : ''}`} onClick={() => setFilter('errors')}>{tt('problems.errors')}</button>
          <button className={`problems-filter-btn ${filter === 'warnings' ? 'active' : ''}`} onClick={() => setFilter('warnings')}>{tt('problems.warnings')}</button>
          <button className="problems-close" onClick={close}><X size={13} /></button>
        </div>
      </div>
      <div className="problems-body" onKeyDown={handleKeyDown}>
        {filteredGroups.length === 0 ? (
          <div className="problems-empty">{tt('problems.noProblems')}</div>
        ) : visibleGroups.map(group => (
          <ProblemFileGroup
            key={group.relPath}
            group={group}
            isOpen={expanded.has(group.relPath)}
            onToggle={toggleExpand}
            onGoToProblem={goToProblem}
            onQuickFix={applyQuickFix}
            selectedItem={flatItems[selectedIndex]}
            onCopyProblem={copyProblem}
          />
        ))}
        {visibleLimit < totalFiltered && (
          <button className="problems-load-more" onClick={() => setVisibleLimit(limit => limit + PROBLEM_PAGE_SIZE)}>
            {tt('problems.showMore', { shown: Math.min(visibleLimit, totalFiltered), total: totalFiltered })}
          </button>
        )}
      </div>
    </div>
  );
}
