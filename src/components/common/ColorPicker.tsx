import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { clamp } from '../../features/colorPicker/clamp';
import type { Hsv } from '../../features/colorPicker/colorTypes';
import { hexToRgb } from '../../features/colorPicker/hexToRgb';
import { hsvToRgb } from '../../features/colorPicker/hsvToRgb';
import { rgbToHex } from '../../features/colorPicker/rgbToHex';
import { rgbToHsv } from '../../features/colorPicker/rgbToHsv';
import { ColorPickerCustomHeader } from './ColorPickerCustomHeader';
import { ColorPickerCustomPanel } from './ColorPickerCustomPanel';
import { ColorPickerSwatches } from './ColorPickerSwatches';
import './ColorPicker.css';

type Direction = 'up' | 'down';

export default function ColorPicker({
  value,
  onChange,
  direction = 'down',
}: {
  value: string;
  onChange: (c: string) => void;
  direction?: Direction;
}) {
  const [open, setOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [hsv, setHsv] = useState<Hsv>(() => rgbToHsv(hexToRgb(value)));
  const ref = useRef<HTMLDivElement>(null);
  const saturationRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHsv(rgbToHsv(hexToRgb(value)));
  }, [value]);

  useEffect(() => {
    if (!open) {
      setCustomOpen(false);
      return;
    }
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const updateFromHsv = (next: Hsv) => {
    const clamped = {
      h: ((next.h % 360) + 360) % 360,
      s: clamp(next.s, 0, 1),
      v: clamp(next.v, 0, 1),
    };
    setHsv(clamped);
    onChange(rgbToHex(hsvToRgb(clamped)));
  };

  const handleSaturationPointer = (clientX: number, clientY: number) => {
    const el = saturationRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const s = clamp((clientX - rect.left) / rect.width, 0, 1);
    const v = clamp(1 - (clientY - rect.top) / rect.height, 0, 1);
    updateFromHsv({ ...hsv, s, v });
  };

  const handleHuePointer = (clientX: number) => {
    const el = hueRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const h = clamp((clientX - rect.left) / rect.width, 0, 1) * 360;
    updateFromHsv({ ...hsv, h });
  };

  const startDrag = (move: (x: number, y: number) => void) => (e: ReactMouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    move(e.clientX, e.clientY);
    const onMove = (event: MouseEvent) => move(event.clientX, event.clientY);
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const rgb = hsvToRgb(hsv);
  const hueColor = `hsl(${hsv.h}, 100%, 50%)`;

  return (
    <div className="color-picker" ref={ref}>
      <button type="button" className="color-picker-preview" style={{ background: value }} onClick={() => setOpen(!open)} />
      {open && (
        <div className={`color-picker-dropdown ${direction === 'up' ? 'open-up' : 'open-down'}`}>
          <ColorPickerSwatches value={value} onChange={onChange} />

          <ColorPickerCustomHeader
            customOpen={customOpen}
            value={value}
            onToggle={() => setCustomOpen(current => !current)}
          />

          {customOpen && (
            <ColorPickerCustomPanel
              direction={direction}
              hsv={hsv}
              hueColor={hueColor}
              hueRef={hueRef}
              rgb={rgb}
              saturationRef={saturationRef}
              value={value}
              onChange={onChange}
              onHueMouseDown={startDrag((x) => handleHuePointer(x))}
              onSaturationMouseDown={startDrag(handleSaturationPointer)}
            />
          )}
        </div>
      )}
    </div>
  );
}
