import { PRESET_COLORS } from '../../features/colorPicker/presetColors';

interface ColorPickerSwatchesProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPickerSwatches({
  onChange,
  value,
}: ColorPickerSwatchesProps) {
  return (
    <div className="color-picker-grid">
      {PRESET_COLORS.map(color => (
        <button
          type="button"
          key={color}
          className={`color-picker-swatch ${color.toLowerCase() === value.toLowerCase() ? 'active' : ''}`}
          style={{ background: color }}
          onClick={() => onChange(color)}
        />
      ))}
    </div>
  );
}
