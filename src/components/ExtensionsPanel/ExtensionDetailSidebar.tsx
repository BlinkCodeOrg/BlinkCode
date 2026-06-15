import { ExternalLink } from 'lucide-react';
import { formatExtensionBytes } from '../../features/extensions/formatExtensionBytes';
import { formatExtensionDate } from '../../features/extensions/formatExtensionDate';
import { openExternalUrl } from '../../features/terminal/openExternalUrl';
import type { MarketplaceExtension } from '../../features/extensions/extensionTypes';
import { useT } from '../../hooks/useT';

const RESOURCE_LABEL_KEYS = {
  repository: 'extensions.repository',
  issues: 'extensions.issues',
  license: 'extensions.license',
  publisher: 'extensions.publisher',
} as const;

export function ExtensionDetailSidebar({ extension }: { extension: MarketplaceExtension }) {
  const tt = useT();
  const locale = document.documentElement.lang || navigator.language || 'en';
  const resources = Object.entries(extension.resources)
    .filter((entry): entry is [keyof typeof RESOURCE_LABEL_KEYS, string] => (
      entry[0] in RESOURCE_LABEL_KEYS && Boolean(entry[1])
    ));

  const rows = [
    [tt('extensions.identifier'), extension.id],
    [tt('extensions.version'), extension.version],
    [tt('extensions.lastUpdated'), formatExtensionDate(extension.lastUpdatedAt, locale)],
    [tt('extensions.size'), formatExtensionBytes(extension.packageSizeBytes)],
    [tt('extensions.cache'), formatExtensionBytes(extension.cacheSizeBytes)],
  ];
  const marketplaceRows = [
    [tt('extensions.published'), formatExtensionDate(extension.publishedAt, locale)],
    [tt('extensions.lastReleased'), formatExtensionDate(extension.lastReleasedAt, locale)],
    [tt('extensions.categories'), extension.categories.join(', ') || '-'],
  ];

  return (
    <aside className="extension-detail-sidebar">
      <section>
        <h2>{tt('extensions.installation')}</h2>
        <dl className="extension-detail-facts">
          <div className="extension-detail-status">
            <dt>{tt('extensions.status')}</dt>
            <dd><span className={extension.installed ? 'is-installed' : ''}>{tt(extension.installed ? 'extensions.installed' : 'extensions.notInstalled')}</span></dd>
          </div>
          {extension.installedAt && (
            <div><dt>{tt('extensions.installedAt')}</dt><dd>{formatExtensionDate(extension.installedAt, locale)}</dd></div>
          )}
          {rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
        </dl>
      </section>
      <section>
        <h2>{tt('extensions.marketplace')}</h2>
        <dl className="extension-detail-facts">
          {marketplaceRows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
        </dl>
      </section>
      <section>
        <h2>{tt('extensions.resources')}</h2>
        <div className="extension-detail-links">
          {resources.map(([key, url]) => (
            <button type="button" key={key} onClick={() => openExternalUrl(url)}>
              <span>{tt(RESOURCE_LABEL_KEYS[key])}</span><ExternalLink size={12} />
            </button>
          ))}
          {extension.license && (
            <span className="extension-detail-license">
              <span>{tt('extensions.license')}</span>
              <strong>{extension.license}</strong>
            </span>
          )}
        </div>
      </section>
    </aside>
  );
}
