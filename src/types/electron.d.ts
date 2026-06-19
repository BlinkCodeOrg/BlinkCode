import type * as React from 'react';

export {};

declare global {
  interface Window {
    electronAPI?: {
      openFolder?: () => Promise<string | null>;
      createProjectFromTemplate?: (request: {
        parentPath: string;
        projectName: string;
        files: Record<string, string>;
      }) => Promise<{ projectPath: string }>;
      openExternal?: (url: string) => Promise<boolean>;
      revealInFolder?: (filePath: string) => Promise<boolean>;
      trashItem?: (filePath: string) => Promise<boolean>;
      getPathForFile?: (file: File) => string;
      minimizeWindow?: () => Promise<void>;
      maximizeWindow?: () => Promise<boolean>;
      closeWindow?: () => Promise<void>;
      forceCloseWindow?: () => Promise<void>;
      onCloseRequested?: (callback: () => void) => () => void;
      isWindowMaximized?: () => Promise<boolean>;
      getSecret?: (key: string) => Promise<string>;
      setSecret?: (key: string, value: string) => Promise<boolean>;
      deleteSecret?: (key: string) => Promise<boolean>;
      checkForUpdates?: () => Promise<{ status: string; version?: string; releaseNotes?: string; percent?: number; error?: string; errorKey?: string; releaseUrl?: string; manualDownloadUrl?: string }>;
      downloadUpdate?: () => Promise<{ status: string; version?: string; releaseNotes?: string; percent?: number; error?: string; errorKey?: string; releaseUrl?: string; manualDownloadUrl?: string }>;
      installUpdate?: () => Promise<boolean>;
      onUpdateStatus?: (callback: (status: { status: string; version?: string; releaseNotes?: string; percent?: number; error?: string; errorKey?: string; releaseUrl?: string; manualDownloadUrl?: string }) => void) => () => void;
    };
  }

  namespace JSX {
    interface IntrinsicElements {
      webview: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        allowpopups?: string;
        webpreferences?: string;
        preload?: string;
        partition?: string;
      };
    }
  }
}
