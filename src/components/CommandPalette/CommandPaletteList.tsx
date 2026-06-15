import type { RefObject } from 'react';
import type { Command } from '../../features/commandPalette/commandTypes';
import { useT } from '../../hooks/useT';

interface CommandPaletteListProps {
  commands: Command[];
  query: string;
  selected: number;
  listRef: RefObject<HTMLDivElement | null>;
  onRun: (command: Command) => void;
  onSelect: (index: number) => void;
}

export function CommandPaletteList({
  commands,
  listRef,
  onRun,
  onSelect,
  query,
  selected,
}: CommandPaletteListProps) {
  const tt = useT();
  return (
    <div className="cmdp-list" ref={listRef}>
      {commands.length === 0 ? (
        <div className="cmdp-empty">{tt('commandPalette.noMatches', { query })}</div>
      ) : (
        commands.map((cmd, idx) => (
          <button
            type="button"
            key={cmd.id}
            data-index={idx}
            className={`cmdp-item${idx === selected ? ' is-selected' : ''}`}
            onMouseEnter={() => onSelect(idx)}
            onClick={() => onRun(cmd)}
          >
            <span className="cmdp-item-icon">{cmd.icon}</span>
            <span className="cmdp-item-body">
              <span className="cmdp-item-title">{cmd.title}</span>
              {cmd.description && <span className="cmdp-item-desc">{cmd.description}</span>}
            </span>
            <span className="cmdp-item-meta">
              <span className="cmdp-item-category">
                {tt(`category.${cmd.category.toLowerCase()}`)}
              </span>
              {cmd.shortcut && <kbd className="cmdp-item-kbd">{cmd.shortcut}</kbd>}
            </span>
          </button>
        ))
      )}
    </div>
  );
}
