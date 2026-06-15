import { Check } from 'lucide-react';
import './ui.css';

interface CheckboxProps {
  ariaLabel?: string;
  checked: boolean;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  title?: string;
}

export function Checkbox({ ariaLabel, checked, children, className = '', disabled, onChange, title }: CheckboxProps) {
  return (
    <label className={`ui-checkbox ${className}`.trim()} title={title}>
      <input aria-label={ariaLabel} type="checkbox" checked={checked} disabled={disabled} onChange={event => onChange(event.target.checked)} />
      <span className="ui-checkbox-box" aria-hidden="true">{checked && <Check size={11} strokeWidth={3} />}</span>
      {children && <span className="ui-checkbox-label">{children}</span>}
    </label>
  );
}
