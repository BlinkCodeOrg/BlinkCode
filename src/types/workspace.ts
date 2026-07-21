export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  content?: string;
  language?: string;
  isExpanded?: boolean;
  serverPath?: string;
  binary?: boolean;
  dirty?: boolean;
  size?: number;
  settingsScope?: 'global' | 'workspace';
  settingsFilePath?: string;
  diffOriginalContent?: string;
  diffModifiedContent?: string;
  diffHunks?: Array<{
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
    type: 'added' | 'deleted' | 'modified';
  }>;
  markdownPreviewContent?: string;
  markdownPreviewSourcePath?: string;
  largePreviewContent?: string;
  largePreviewOffset?: number;
  largePreviewDone?: boolean;
  virtual?: boolean;
  extensionDetail?: ExtensionDetail;
}

export interface ExtensionDetail {
  id: string;
  displayName: string;
  publisher: string;
  version: string;
  description: string;
  categories: string[];
  permissions: string[];
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

export interface Tab {
  id: string;
  fileId: string;
  name: string;
  language?: string;
  pinned?: boolean;
}
