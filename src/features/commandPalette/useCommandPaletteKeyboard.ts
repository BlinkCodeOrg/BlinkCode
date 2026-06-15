import { useEffect } from 'react';
import type { Command } from './commandTypes';

interface UseCommandPaletteKeyboardParams {
  filtered: Command[];
  listRef: React.RefObject<HTMLDivElement | null>;
  runCommand: (command: Command) => void;
  selected: number;
  setSelected: React.Dispatch<React.SetStateAction<number>>;
  close: () => void;
}

export function useCommandPaletteKeyboard({
  close,
  filtered,
  listRef,
  runCommand,
  selected,
  setSelected,
}: UseCommandPaletteKeyboardParams) {
  useEffect(() => {
    if (selected >= filtered.length) setSelected(0);
  }, [filtered.length, selected, setSelected]);

  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-index="${selected}"]`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [listRef, selected]);

  return (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelected(current => Math.min(filtered.length - 1, current + 1));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelected(current => Math.max(0, current - 1));
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      setSelected(0);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      setSelected(Math.max(0, filtered.length - 1));
      return;
    }
    if (event.key === 'PageDown') {
      event.preventDefault();
      setSelected(current => Math.min(filtered.length - 1, current + 8));
      return;
    }
    if (event.key === 'PageUp') {
      event.preventDefault();
      setSelected(current => Math.max(0, current - 8));
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const command = filtered[selected];
      if (command) runCommand(command);
    }
  };
}
