import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import './ui.css';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  ariaLabel?: string;
  className?: string;
  disabled?: boolean;
  options: SelectOption[];
  testId?: string;
  value: string | number;
  onChange: (value: string | number) => void;
}

export function Select({ ariaLabel, className = '', disabled, options, testId, value, onChange }: SelectProps) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<'top' | 'bottom'>('bottom');
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({ visibility: 'hidden' });
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const current = options.find(option => option.value === value);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!ref.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !ref.current) return;
    const updatePosition = () => {
      const trigger = ref.current?.getBoundingClientRect();
      const menu = menuRef.current;
      if (!trigger || !menu) return;
      const margin = 8;
      const width = Math.max(trigger.width, Math.min(260, menu.scrollWidth));
      const preferredLeft = trigger.left;
      const left = Math.min(window.innerWidth - width - margin, Math.max(margin, preferredLeft));
      const below = trigger.bottom + 4;
      const availableBelow = window.innerHeight - below - margin;
      const openAbove = availableBelow < Math.min(210, menu.scrollHeight) && trigger.top > availableBelow;
      setPlacement(openAbove ? 'top' : 'bottom');
      setMenuStyle({
        left,
        top: openAbove ? undefined : below,
        bottom: openAbove ? window.innerHeight - trigger.top + 4 : undefined,
        width,
        maxHeight: Math.max(90, Math.min(210, openAbove ? trigger.top - margin : availableBelow)),
        visibility: 'visible',
      });
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, options.length]);

  return (
    <div className={`ui-select ${className}`.trim()} ref={ref}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className="ui-select-trigger"
        data-testid={testId}
        disabled={disabled}
        onClick={() => {
          setMenuStyle({ visibility: 'hidden' });
          setOpen(currentOpen => !currentOpen);
        }}
      >
        <span>{current?.label || String(value)}</span>
        <ChevronDown size={13} className={`ui-select-arrow ${open ? 'open' : ''}`} />
      </button>
      {open && createPortal(
        <div className="ui-select-menu ui-select-menu-portal" data-placement={placement} role="listbox" ref={menuRef} style={menuStyle}>
          {options.map(option => (
            <button
              type="button"
              key={String(option.value)}
              aria-selected={option.value === value}
              className={`ui-select-option ${option.value === value ? 'active' : ''}`}
              data-option-value={String(option.value)}
              disabled={option.disabled}
              onClick={() => { onChange(option.value); setOpen(false); }}
              role="option"
            >
              <Check size={12} />
              <span>{option.label}</span>
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}
