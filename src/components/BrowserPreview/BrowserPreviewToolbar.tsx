import type { FormEvent } from 'react';
import { ArrowLeft, ArrowRight, ExternalLink, Globe, History, Monitor, RefreshCw, Smartphone, SquareTerminal, Tablet, X } from 'lucide-react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useT } from '../../hooks/useT';

type BrowserPreviewToolbarProps = {
  addressValue: string;
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading: boolean;
  isSupportedUrl: boolean;
  onAddressChange: (value: string) => void;
  onSubmitAddress: (event: FormEvent) => void;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onOpenExternal: () => void;
  onClose: () => void;
  consoleOpen: boolean;
  consoleCount: number;
  consoleProblemCount: number;
  recentUrls: string[];
  onToggleConsole: () => void;
  onSelectRecentUrl: (url: string) => void;
  device: 'responsive' | 'mobile' | 'tablet';
  onDeviceChange: (device: 'responsive' | 'mobile' | 'tablet') => void;
};

export function BrowserPreviewToolbar({
  addressValue,
  canGoBack,
  canGoForward,
  isLoading,
  isSupportedUrl,
  onAddressChange,
  onSubmitAddress,
  onBack,
  onForward,
  onReload,
  onOpenExternal,
  onClose,
  consoleOpen,
  consoleCount,
  consoleProblemCount,
  recentUrls,
  onToggleConsole,
  onSelectRecentUrl,
  device,
  onDeviceChange,
}: BrowserPreviewToolbarProps) {
  const tt = useT();
  const deviceLabels = {
    responsive: tt('browser.responsive'),
    tablet: tt('browser.tablet'),
    mobile: tt('browser.mobile'),
  };
  const recentUrlOptions = [
    { value: '__recent__', label: tt('browser.recentUrls'), disabled: true },
    ...recentUrls.map(url => ({ value: url, label: url })),
  ];
  return (
    <header className="browser-preview-toolbar">
      <div className="browser-preview-toolbar-group">
        <button type="button" className="browser-preview-button" onClick={onBack} disabled={!canGoBack} title={tt('common.back')}>
          <ArrowLeft size={16} />
        </button>
        <button type="button" className="browser-preview-button" onClick={onForward} disabled={!canGoForward} title={tt('common.forward')}>
          <ArrowRight size={16} />
        </button>
        <button type="button" className="browser-preview-button" onClick={onReload} disabled={!isSupportedUrl} title={tt('common.reload')}>
          <RefreshCw size={16} className={isLoading ? 'browser-preview-spin' : ''} />
        </button>
      </div>

      <form className="browser-preview-address" onSubmit={onSubmitAddress}>
        <Globe size={15} className="browser-preview-address-icon" />
        <Input
          type="text"
          value={addressValue}
          onChange={(event) => onAddressChange(event.target.value)}
          placeholder={tt('browser.urlPlaceholder')}
          spellCheck={false}
        />
      </form>

      <div className="browser-preview-toolbar-group">
        {recentUrls.length > 0 && (
          <div className="browser-preview-history" title={tt('browser.recentUrls')}>
            <History size={14} />
            <Select
              ariaLabel={tt('browser.recentUrls')}
              className="browser-preview-history-select"
              options={recentUrlOptions}
              value="__recent__"
              onChange={value => {
                if (value !== '__recent__') onSelectRecentUrl(String(value));
              }}
            />
          </div>
        )}
        <div className="browser-preview-devices" aria-label={tt('browser.previewSize')}>
          {([
            ['responsive', Monitor],
            ['tablet', Tablet],
            ['mobile', Smartphone],
          ] as const).map(([value, Icon]) => (
            <button
              key={value}
              type="button"
              className={`browser-preview-button ${device === value ? 'active' : ''}`}
              onClick={() => onDeviceChange(value)}
              title={deviceLabels[value]}
            >
              <Icon size={15} />
            </button>
          ))}
        </div>
        <button type="button" className="browser-preview-button" onClick={onOpenExternal} disabled={!isSupportedUrl} title={tt('browser.openExternal')}>
          <ExternalLink size={16} />
        </button>
        <button
          type="button"
          className={`browser-preview-button browser-preview-console-toggle ${consoleOpen ? 'active' : ''} ${consoleProblemCount ? 'has-problems' : ''}`}
          onClick={onToggleConsole}
          title={tt('browser.console')}
        >
          <SquareTerminal size={16} />
          {consoleCount > 0 && <span>{consoleProblemCount || consoleCount}</span>}
        </button>
        <button type="button" className="browser-preview-button browser-preview-button-danger" onClick={onClose} title={tt('browser.close')}>
          <X size={16} />
        </button>
      </div>
    </header>
  );
}
