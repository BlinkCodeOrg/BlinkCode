import { Search, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Input } from '../ui/Input';

interface SettingsSearchProps {
  open: boolean;
  query: string;
  tt: (key: string) => string;
  onChange: (query: string) => void;
  onClose: () => void;
}

export function SettingsSearch({ onChange, onClose, open, query, tt }: SettingsSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  if (!open) return null;
  return (
    <div className="settings-search" data-testid="settings-search">
      <Search size={14} />
      <Input
        ref={inputRef}
        aria-label={tt('settings.search')}
        placeholder={tt('settings.searchPlaceholder')}
        value={query}
        onChange={event => onChange(event.target.value)}
        onKeyDown={event => {
          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            onClose();
          }
        }}
      />
      {query && (
        <button type="button" onClick={() => onChange('')} title={tt('settings.clearSearch')}>
          <X size={13} />
        </button>
      )}
    </div>
  );
}
