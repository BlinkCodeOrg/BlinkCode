import { useState } from 'react';
import { ConfirmDialog } from './ConfirmDialog';

interface ConfirmOptions {
  cancelLabel: string;
  confirmLabel: string;
  danger?: boolean;
  details?: string;
  message: string;
  title: string;
}

export function useConfirmDialog() {
  const [request, setRequest] = useState<(ConfirmOptions & { resolve: (value: boolean) => void }) | null>(null);

  const confirm = (options: ConfirmOptions) => new Promise<boolean>(resolve => setRequest({ ...options, resolve }));
  const close = (value: boolean) => {
    request?.resolve(value);
    setRequest(null);
  };

  return {
    confirm,
    dialog: request ? (
      <ConfirmDialog {...request} onCancel={() => close(false)} onConfirm={() => close(true)} />
    ) : null,
  };
}
