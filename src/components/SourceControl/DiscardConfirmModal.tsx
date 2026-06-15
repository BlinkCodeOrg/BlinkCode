import { formatDiscardConfirmMessage } from '../../features/sourceControl/formatDiscardConfirmMessage';
import { ConfirmDialog } from '../ui/ConfirmDialog';

type DiscardConfirmModalProps = {
  paths: string[];
  tt: (key: string) => string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DiscardConfirmModal({ paths, tt, onCancel, onConfirm }: DiscardConfirmModalProps) {
  return (
    <ConfirmDialog
      cancelLabel={tt('common.cancel')}
      confirmLabel={tt('sc.discardConfirmAction')}
      danger
      details={paths.length === 1 ? paths[0] : undefined}
      message={formatDiscardConfirmMessage(paths, tt)}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title={tt('sc.discardConfirmTitle')}
    />
  );
}
