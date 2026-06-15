import { ChevronDown, ChevronRight, FileText, Lightbulb } from 'lucide-react';
import type { DiagnosticItem, FileGroup } from '../../features/problems/problemTypes';
import { severityIcon } from '../../features/problems/severityIcon';
import { useT } from '../../hooks/useT';

type ProblemFileGroupProps = {
  group: FileGroup;
  isOpen: boolean;
  onToggle: (path: string) => void;
  onGoToProblem: (item: DiagnosticItem) => void;
  onQuickFix: (item: DiagnosticItem) => void;
  selectedItem?: DiagnosticItem;
};

export function ProblemFileGroup({ group, isOpen, onToggle, onGoToProblem, onQuickFix, selectedItem }: ProblemFileGroupProps) {
  const tt = useT();
  return (
    <div className="problems-file-group">
      <button className="problems-file-head" onClick={() => onToggle(group.relPath)}>
        {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        <FileText size={13} />
        <span className="problems-file-path">{group.relPath}</span>
        <span className="problems-file-counts">
          {group.errors > 0 && <span className="problems-cnt-error">{group.errors}</span>}
          {group.warnings > 0 && <span className="problems-cnt-warning">{group.warnings}</span>}
        </span>
      </button>
      {isOpen && group.items.map((item, idx) => (
        <div className={`problems-item-row ${selectedItem === item ? 'selected' : ''}`} key={`${group.relPath}:${item.startLineNumber}:${item.startColumn}:${idx}`}>
        <button
          className="problems-item"
          onClick={() => onGoToProblem(item)}
        >
          {severityIcon(item.severity)}
          <span className="problems-msg">{item.message}</span>
          {item.code && <span className="problems-code">{item.source ? `${item.source}(${item.code})` : item.code}</span>}
          <span className="problems-loc">[{tt('status.lineColumn', { line: item.startLineNumber, column: item.startColumn })}]</span>
        </button>
        <button className="problems-quick-fix" onClick={() => onQuickFix(item)} title={tt('problems.quickFix')}>
          <Lightbulb size={13} />
        </button>
        </div>
      ))}
    </div>
  );
}
