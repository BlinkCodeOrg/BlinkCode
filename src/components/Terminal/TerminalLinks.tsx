import { openExternalUrl } from '../../features/terminal/openExternalUrl';

type TerminalLinksProps = {
  urls: string[];
  onOpenPreview: (url: string) => void;
};

export function TerminalLinks({ urls, onOpenPreview }: TerminalLinksProps) {
  if (urls.length === 0) return null;

  return (
    <div className="term-links-list">
      {urls.map(url => (
        <button
          key={url}
          type="button"
          className="term-link-chip"
          onClick={() => onOpenPreview(url)}
          onAuxClick={(event) => {
            if (event.button === 1) openExternalUrl(url);
          }}
          onContextMenu={(event) => {
            event.preventDefault();
            openExternalUrl(url);
          }}
          title={url}
        >
          {url}
        </button>
      ))}
    </div>
  );
}
