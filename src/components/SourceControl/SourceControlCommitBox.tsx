import { Checkbox } from '../ui/Checkbox';

type SourceControlCommitBoxProps = {
  value: string;
  committing: boolean;
  stagedCount: number;
  amend: boolean;
  tt: (key: string) => string;
  onChange: (value: string) => void;
  onCommit: () => void;
  onAmendChange: (value: boolean) => void;
};

export function SourceControlCommitBox({ value, committing, stagedCount, amend, tt, onChange, onCommit, onAmendChange }: SourceControlCommitBoxProps) {
  return (
    <div className="sc-commit-area">
      <textarea
        className="sc-commit-input"
        placeholder={tt('sc.commitPlaceholder')}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') onCommit();
        }}
        rows={1}
      />
      <Checkbox checked={amend} className="sc-amend-toggle" onChange={onAmendChange}>{tt('sc.amend')}</Checkbox>
      <button
        className="sc-commit-btn"
        onClick={onCommit}
        disabled={committing || !value.trim() || (stagedCount === 0 && !amend)}
      >
        {tt('sc.commit')}
      </button>
    </div>
  );
}
