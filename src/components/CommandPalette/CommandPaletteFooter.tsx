import { ArrowDown, ArrowUp, CornerDownLeft } from 'lucide-react';
import { useT } from '../../hooks/useT';

interface CommandPaletteFooterProps {
  commandCount: number;
  filteredCount: number;
}

export function CommandPaletteFooter({
  commandCount,
  filteredCount,
}: CommandPaletteFooterProps) {
  const tt = useT();
  return (
    <div className="cmdp-footer">
      <span><kbd><ArrowUp size={10} /></kbd><kbd><ArrowDown size={10} /></kbd> {tt('common.navigate')}</span>
      <span><kbd><CornerDownLeft size={10} /></kbd> {tt('commandPalette.runHint')}</span>
      <span><kbd>Esc</kbd> {tt('common.close').toLowerCase()}</span>
      <span className="cmdp-count">{filteredCount} / {commandCount}</span>
    </div>
  );
}
