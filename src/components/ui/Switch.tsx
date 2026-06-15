import './ui.css';

interface SwitchProps {
  ariaLabel?: string;
  disabled?: boolean;
  offLabel?: string;
  onLabel?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

export function Switch({ ariaLabel, disabled, offLabel, onLabel, value, onChange }: SwitchProps) {
  return (
    <button
      type="button"
      aria-checked={value}
      aria-label={ariaLabel}
      className={`ui-switch ${value ? 'on' : ''}`}
      disabled={disabled}
      onClick={() => onChange(!value)}
      role="switch"
    >
      <span className="ui-switch-track"><span className="ui-switch-thumb" /></span>
      {(onLabel || offLabel) && <span className="ui-switch-label">{value ? onLabel : offLabel}</span>}
    </button>
  );
}
