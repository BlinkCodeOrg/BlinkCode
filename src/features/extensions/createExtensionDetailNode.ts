import type { FileNode } from '../../types';
import type { MarketplaceExtension } from './extensionTypes';

export function createExtensionDetailNode(extension: MarketplaceExtension): FileNode {
  return {
    id: `extension-detail:${extension.id}`,
    name: extension.displayName,
    type: 'file',
    language: 'extension-detail',
    virtual: true,
    extensionDetail: {
      id: extension.id,
      displayName: extension.displayName,
      publisher: extension.publisher,
      version: extension.version,
      description: extension.description,
      categories: extension.categories,
      permissions: extension.permissions,
      iconDataUrl: extension.iconDataUrl,
      readme: extension.readme,
      cacheSizeBytes: extension.cacheSizeBytes,
      packageSizeBytes: extension.packageSizeBytes,
      installedAt: extension.installedAt,
      license: extension.license,
      publishedAt: extension.publishedAt,
      lastUpdatedAt: extension.lastUpdatedAt,
      lastReleasedAt: extension.lastReleasedAt,
      resources: extension.resources,
    },
  };
}
