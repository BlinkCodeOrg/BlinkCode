import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEditor } from '../../store/EditorContext';
import { Search, ArrowDown, ArrowUp } from 'lucide-react';
import { fetchQuickOpenFiles } from '../../features/quickOpen/fetchQuickOpenFiles';
import { findNodeByPath } from '../../features/workspaceTree/findNodeByPath';
import { scoreQuickOpenPath } from '../../features/search/scoreQuickOpenPath';
import { QuickOpenItem } from './QuickOpenItem';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { getRecentFiles, recordRecentFile } from '../../features/recentFiles/recentFiles';
import { useT } from '../../hooks/useT';
import './QuickOpen.css';

export default function QuickOpen() {
  const { openFile, state } = useEditor();
  const tt = useT();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const [files, setFiles] = useState<string[]>([]);
  const [recentFiles, setRecentFiles] = useState<string[]>(getRecentFiles);
  const [recentOnly, setRecentOnly] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const fetchFiles = async () => {
      try {
        setFiles(await fetchQuickOpenFiles());
      } catch {
        setFiles([]);
      }
    };
    fetchFiles();
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) {
      const ordered = [...recentFiles.filter(file => files.includes(file)), ...files.filter(file => !recentFiles.includes(file))];
      return (recentOnly ? ordered.filter(file => recentFiles.includes(file)) : ordered).slice(0, 50);
    }
    if (q.startsWith('@')) {
      const symbolQuery = q.slice(1).trim().toLowerCase();
      const editor = (window as any).__blinkcodeEditor;
      const model = editor?.getModel?.();
      if (!model) return [];
      return model.getValue().split('\n')
        .map((line: string, index: number) => ({ line, index }))
        .filter(({ line }: { line: string }) => /\b(function|class|interface|type|const|let|var)\b/.test(line) && line.toLowerCase().includes(symbolQuery))
        .slice(0, 50)
        .map(({ line, index }: { line: string; index: number }) => `@${index + 1}:${line.trim()}`);
    }
    const scored = files
      .map(f => ({ f, s: scoreQuickOpenPath(q, f) }))
      .filter(x => x.s >= 0)
      .sort((a, b) => b.s - a.s);
    return scored.slice(0, 50).map(x => x.f);
  }, [files, query, recentFiles, recentOnly]);

  useEffect(() => { setSelected(0); }, [query]);

  const openByPath = useCallback((relativePath: string) => {
    if (relativePath.startsWith('@')) {
      const line = Number(relativePath.slice(1).split(':')[0]);
      const editor = (window as any).__blinkcodeEditor;
      editor?.setPosition?.({ lineNumber: line, column: 1 });
      editor?.revealLineInCenter?.(line);
      editor?.focus?.();
      setOpen(false);
      return;
    }
    setOpen(false);
    const nextRecent = recordRecentFile(relativePath);
    setRecentFiles(nextRecent);
    const file = findNodeByPath(state.files, relativePath);
    if (file) {
      openFile(file);
      return;
    }

    void (async () => {
      try {
        await fetch('/api/tree');
      } catch {}
    })();
  }, [openFile, state.files]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(i => Math.min(filtered.length - 1, i + 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(i => Math.max(0, i - 1)); }
      else if (e.key === 'Enter') {
        e.preventDefault();
        const path = filtered[selected];
        if (path) openByPath(path);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, filtered, selected, openByPath]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail?.openQuickOpen) return;
      setRecentFiles(getRecentFiles());
      setRecentOnly(Boolean(detail.recentOnly));
      setOpen(true);
    };
    window.addEventListener('blinkcode:openQuickOpen', handler);
    return () => window.removeEventListener('blinkcode:openQuickOpen', handler);
  }, []);

  useEffect(() => { if (open) { setQuery(''); setSelected(0); inputRef.current?.focus(); } }, [open]);

  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.children[selected] as HTMLElement | undefined;
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  if (!open) return null;

  return (
    <Modal ariaLabel={tt('quickOpen.title')} className="quickopen-modal" onClose={() => setOpen(false)} placement="top">
      <div className="quickopen-modal-content">
        <div className="quickopen-input-wrap">
          <Search size={16} className="quickopen-search-icon" />
          <Input
            ref={inputRef}
            className="quickopen-input"
            placeholder={recentOnly ? tt('quickOpen.recentPlaceholder') : tt('quickOpen.placeholder')}
            value={query}
            onChange={e => setQuery(e.target.value)}
            spellCheck={false}
            autoComplete="off"
          />
          <div className="quickopen-hint">
            <ArrowUp size={12} /><ArrowDown size={12} /> {tt('common.navigate')} <span className="quickopen-hint-sep">.</span> {tt('quickOpen.enterOpen')}
          </div>
        </div>
        <div className="quickopen-list" ref={listRef}>
          {filtered.length === 0 && (
            <div className="quickopen-empty">{tt('quickOpen.noMatches')}</div>
          )}
          {filtered.map((path: string, idx: number) => (
            <QuickOpenItem
              key={path}
              path={path}
              active={idx === selected}
              onOpen={openByPath}
              onSelect={() => setSelected(idx)}
            />
          ))}
        </div>
      </div>
    </Modal>
  );
}
