import { clamp } from '../../features/colorPicker/clamp';
import type { Hsv, Rgb } from '../../features/colorPicker/colorTypes';
import { rgbToHex } from '../../features/colorPicker/rgbToHex';
import { Input } from '../ui/Input';

type Direction = 'up' | 'down';

interface ColorPickerCustomPanelProps {
  direction: Direction;
  hsv: Hsv;
  hueColor: string;
  rgb: Rgb;
  saturationRef: React.RefObject<HTMLDivElement | null>;
  hueRef: React.RefObject<HTMLDivElement | null>;
  value: string;
  onChange: (color: string) => void;
  onHueMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void;
  onSaturationMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void;
}

export function ColorPickerCustomPanel({
  direction,
  hsv,
  hueColor,
  hueRef,
  onChange,
  onHueMouseDown,
  onSaturationMouseDown,
  rgb,
  saturationRef,
  value,
}: ColorPickerCustomPanelProps) {
  return (
    <div className={`color-picker-panel ${direction === 'up' ? 'panel-up' : 'panel-down'}`}>
      <div
        ref={saturationRef}
        className="color-picker-panel-sv"
        style={{ backgroundColor: hueColor }}
        onMouseDown={onSaturationMouseDown}
      >
        <div className="color-picker-panel-sv-white" />
        <div className="color-picker-panel-sv-black" />
        <div
          className="color-picker-panel-sv-thumb"
          style={{
            left: `${hsv.s * 100}%`,
            top: `${(1 - hsv.v) * 100}%`,
            background: value,
          }}
        />
      </div>

      <div className="color-picker-panel-controls">
        <div className="color-picker-panel-row">
          <div className="color-picker-panel-preview" style={{ background: value }} />
          <div
            ref={hueRef}
            className="color-picker-panel-hue"
            onMouseDown={onHueMouseDown}
          >
            <div
              className="color-picker-panel-hue-thumb"
              style={{ left: `${(hsv.h / 360) * 100}%` }}
            />
          </div>
        </div>

        <div className="color-picker-panel-rgb">
          {([
            ['R', rgb.r],
            ['G', rgb.g],
            ['B', rgb.b],
          ] as const).map(([label, channel]) => (
            <label key={label} className="color-picker-panel-field">
              <Input
                type="number"
                min={0}
                max={255}
                value={channel}
                onChange={(event) => {
                  const next = clamp(Number(event.target.value || 0), 0, 255);
                  const nextRgb: Rgb = label === 'R'
                    ? { ...rgb, r: next }
                    : label === 'G'
                      ? { ...rgb, g: next }
                      : { ...rgb, b: next };
                  onChange(rgbToHex(nextRgb));
                }}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
