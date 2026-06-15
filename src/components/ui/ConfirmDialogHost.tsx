import { useEffect, useState } from 'react';
import { ConfirmDialog } from './ConfirmDialog';
import { CONFIRMATION_EVENT, type ConfirmationOptions } from '../../shared/ui/requestConfirmation';

type ConfirmationRequest = {
  options: ConfirmationOptions;
  resolve: (value: boolean) => void;
};

export function ConfirmDialogHost() {
  const [request, setRequest] = useState<ConfirmationRequest | null>(null);

  useEffect(() => {
    const handleRequest = (event: Event) => {
      const next = (event as CustomEvent<ConfirmationRequest>).detail;
      setRequest(current => {
        current?.resolve(false);
        return next;
      });
    };
    window.addEventListener(CONFIRMATION_EVENT, handleRequest);
    return () => window.removeEventListener(CONFIRMATION_EVENT, handleRequest);
  }, []);

  const close = (value: boolean) => {
    request?.resolve(value);
    setRequest(null);
  };

  return request ? (
    <ConfirmDialog
      {...request.options}
      onCancel={() => close(false)}
      onConfirm={() => close(true)}
    />
  ) : null;
}
