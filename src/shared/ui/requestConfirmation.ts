export interface ConfirmationOptions {
  cancelLabel: string;
  confirmLabel: string;
  danger?: boolean;
  details?: string;
  message: string;
  title: string;
}

export const CONFIRMATION_EVENT = 'blinkcode:requestConfirmation';

export function requestConfirmation(options: ConfirmationOptions) {
  return new Promise<boolean>(resolve => {
    window.dispatchEvent(new CustomEvent(CONFIRMATION_EVENT, {
      detail: { options, resolve },
    }));
  });
}
