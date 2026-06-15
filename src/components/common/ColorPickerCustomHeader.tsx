import { useT } from '../../hooks/useT';

interface ColorPickerCustomHeaderProps {
  customOpen: boolean;
  value: string;
  onToggle: () => void;
}

export function ColorPickerCustomHeader({
  customOpen,
  onToggle,
  value,
}: ColorPickerCustomHeaderProps) {
  const tt = useT();
  return (
    <div className="color-picker-custom">
      <button type="button" className={`color-picker-custom-label ${customOpen ? 'active' : ''}`} onClick={onToggle}>
        <span className="color-picker-custom-chip" style={{ background: value }} />
        <span>{tt('common.custom')}</span>
      </button>
      <span className="color-picker-hex">{value}</span>
    </div>
  );
}
