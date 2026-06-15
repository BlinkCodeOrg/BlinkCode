import { CheckCircle2, CircleOff } from 'lucide-react';
import type { MarketplaceExtension } from '../../features/extensions/extensionTypes';
import type { ExtensionOperation } from '../../features/apiClient/updateExtension';
import { Button } from '../ui/Button';

interface ExtensionCardProps {
  busy: boolean;
  extension: MarketplaceExtension;
  onOpen: (extension: MarketplaceExtension) => void;
  onUpdate: (id: string, operation: ExtensionOperation) => void;
  tt: (key: string) => string;
}

export function ExtensionCard({ busy, extension, onOpen, onUpdate, tt }: ExtensionCardProps) {
  const operation: ExtensionOperation = !extension.installed
    ? 'install'
    : extension.enabled
      ? 'disable'
      : 'enable';
  const operationLabel = !extension.installed
    ? tt('extensions.install')
    : extension.enabled
      ? tt('extensions.disable')
      : tt('extensions.enable');

  return (
    <article className={`extension-card compact${extension.enabled ? ' enabled' : ''}`} data-extension-id={extension.id}>
      <button className="extension-card-main" onClick={() => onOpen(extension)}>
        <img className="extension-logo" src={extension.iconDataUrl} alt="" />
        <span className="extension-heading">
          <strong>{extension.displayName}</strong>
          <small>{extension.publisher}</small>
        </span>
        {extension.enabled ? <CheckCircle2 size={14} /> : <CircleOff size={14} />}
      </button>
      {extension.activationError && <div className="extension-error">{extension.activationError}</div>}
      <footer>
        <Button disabled={busy} onClick={() => onUpdate(extension.id, operation)}>{operationLabel}</Button>
        <button className="extension-details-link" onClick={() => onOpen(extension)}>{tt('extensions.details')}</button>
      </footer>
    </article>
  );
}
