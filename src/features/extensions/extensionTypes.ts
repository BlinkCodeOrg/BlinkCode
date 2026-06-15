export type ExtensionCommandAction =
  | { type: 'showMessage'; message: string }
  | { type: 'openSettings' };

export interface ExtensionCommand {
  command: string;
  extensionId: string;
  title: string;
  action: ExtensionCommandAction;
}

export interface MarketplaceExtension {
  id: string;
  name: string;
  displayName: string;
  publisher: string;
  version: string;
  description: string;
  categories: string[];
  permissions: string[];
  featured: boolean;
  installed: boolean;
  enabled: boolean;
  activationError: string | null;
  iconDataUrl: string;
  readme: string;
  cacheSizeBytes: number;
  packageSizeBytes: number;
  installedAt: string | null;
  license: string | null;
  publishedAt: string | null;
  lastUpdatedAt: string | null;
  lastReleasedAt: string | null;
  resources: Partial<Record<'repository' | 'issues' | 'license' | 'marketplace' | 'publisher', string>>;
}

export interface ExtensionSnapshot {
  activeFeatures: string[];
  commands: ExtensionCommand[];
  extensions: MarketplaceExtension[];
}
