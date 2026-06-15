import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { useEditor } from '../../store/EditorContext';
import { createCommandPaletteCommands } from '../../features/commandPalette/createCommandPaletteCommands';
import type { Command } from '../../features/commandPalette/commandTypes';
import { runMonacoAction } from '../../features/commandPalette/runMonacoAction';
import { useCommandPaletteKeyboard } from '../../features/commandPalette/useCommandPaletteKeyboard';
import { useFilteredCommands } from '../../features/commandPalette/useFilteredCommands';
import { CommandPaletteFooter } from './CommandPaletteFooter';
import { CommandPaletteList } from './CommandPaletteList';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { useT } from '../../hooks/useT';
import './CommandPalette.css';

export default function CommandPalette() {
  const tt = useT();
  const {
    state,
    dispatch,
    toggleSidebar,
    toggleTerminal,
    toggleAIPanel,
    toggleSettings,
    updateSettings,
    closeTab,
    triggerEditorAction,
    openFolderFromServer,
    closeBrowserPreview,
    collapseAll,
    addToast,
    splitTab,
    closeSplitTab,
  } = useEditor();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const [recentIds, setRecentIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('blinkcode-command-history') || '[]'); } catch { return []; }
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setSelected(0);
  }, []);

  const commands = useMemo(() => createCommandPaletteCommands({
    addToast,
    closeBrowserPreview,
    closeSplitTab,
    closeTab,
    collapseAll,
    dispatch,
    openFolderFromServer,
    runMonacoAction,
    splitTab,
    state,
    tt,
    toggleAIPanel,
    toggleSettings,
    toggleSidebar,
    toggleTerminal,
    triggerEditorAction,
    updateSettings,
  }), [
    addToast,
    closeBrowserPreview,
    closeSplitTab,
    closeTab,
    collapseAll,
    dispatch,
    openFolderFromServer,
    splitTab,
    state,
    tt,
    toggleAIPanel,
    toggleSettings,
    toggleSidebar,
    toggleTerminal,
    triggerEditorAction,
    updateSettings,
  ]);
  const filteredBase = useFilteredCommands(commands, query);
  const filtered = useMemo(() => [...filteredBase].sort((a, b) => {
    const left = recentIds.indexOf(a.id);
    const right = recentIds.indexOf(b.id);
    if (left === -1 && right === -1) return 0;
    if (left === -1) return 1;
    if (right === -1) return -1;
    return left - right;
  }), [filteredBase, recentIds]);

  useEffect(() => {
    const toggle = () => setOpen(prev => !prev);
    window.addEventListener('blinkcode:toggleCommandPalette', toggle);
    return () => window.removeEventListener('blinkcode:toggleCommandPalette', toggle);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const runCommand = (cmd: Command) => {
    const nextRecent = [cmd.id, ...recentIds.filter(id => id !== cmd.id)].slice(0, 12);
    setRecentIds(nextRecent);
    localStorage.setItem('blinkcode-command-history', JSON.stringify(nextRecent));
    close();
    setTimeout(() => {
      try { cmd.run(); } catch (err) { console.error('[CommandPalette] run failed', err); }
    }, 0);
  };

  const onKeyDown = useCommandPaletteKeyboard({
    close,
    filtered,
    listRef,
    runCommand,
    selected,
    setSelected,
  });

  if (!open) return null;

  return (
    <Modal ariaLabel={tt('kb.commandPalette')} className="cmdp-modal" onClose={close} placement="top">
      <div
        className="cmdp-modal-content"
      >
        <div className="cmdp-input-row">
          <Search size={14} className="cmdp-input-icon" />
          <Input
            ref={inputRef}
            className="cmdp-input"
            placeholder={tt('commandPalette.placeholder')}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0); }}
            onKeyDown={onKeyDown}
            spellCheck={false}
          />
          <span className="cmdp-hint">
            <kbd>Esc</kbd> {tt('commandPalette.closeHint')}
          </span>
        </div>
        <CommandPaletteList
          commands={filtered}
          listRef={listRef}
          onRun={runCommand}
          onSelect={setSelected}
          query={query}
          selected={selected}
        />
        <CommandPaletteFooter commandCount={commands.length} filteredCount={filtered.length} />
      </div>
    </Modal>
  );
}
