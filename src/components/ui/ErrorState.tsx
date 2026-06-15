import { RotateCcw, TriangleAlert } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  retryLabel: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry, retryLabel }: ErrorStateProps) {
  return (
    <div className="ui-error-state" role="alert">
      <TriangleAlert size={22} />
      <strong>{message}</strong>
      <button type="button" onClick={onRetry}><RotateCcw size={13} />{retryLabel}</button>
    </div>
  );
}
