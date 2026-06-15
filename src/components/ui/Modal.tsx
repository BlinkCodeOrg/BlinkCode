import { forwardRef, useEffect, type ReactNode } from 'react';
import './ui.css';

interface ModalProps {
  ariaLabel?: string;
  children: ReactNode;
  className?: string;
  onClose: () => void;
  placement?: 'center' | 'top';
}

export const Modal = forwardRef<HTMLDivElement, ModalProps>(function Modal(
  { ariaLabel, children, className = '', onClose, placement = 'center' },
  ref,
) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    <div className={`ui-modal-backdrop ui-modal-backdrop-${placement}`} role="presentation" onMouseDown={onClose}>
      <div
        aria-label={ariaLabel}
        aria-modal="true"
        className={`ui-modal ${className}`.trim()}
        onMouseDown={event => event.stopPropagation()}
        ref={ref}
        role="dialog"
      >
        {children}
      </div>
    </div>
  );
});
