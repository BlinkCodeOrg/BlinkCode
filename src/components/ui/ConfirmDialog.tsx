import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  cancelLabel: string;
  confirmLabel: string;
  danger?: boolean;
  details?: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
}

export function ConfirmDialog({
  cancelLabel,
  confirmLabel,
  danger,
  details,
  message,
  onCancel,
  onConfirm,
  title,
}: ConfirmDialogProps) {
  return (
    <Modal ariaLabel={title} className="ui-confirm" onClose={onCancel}>
      <div className="ui-confirm-heading">
        <span className="ui-confirm-icon"><AlertTriangle size={15} /></span>
        <strong>{title}</strong>
      </div>
      <p>{message}</p>
      {details && <code>{details}</code>}
      <div className="ui-confirm-actions">
        <Button onClick={onCancel}>{cancelLabel}</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}
