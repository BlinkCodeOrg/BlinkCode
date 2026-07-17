import type * as React from 'react';
import type { UpdateMockState, UpdateStatus } from '../features/updates/types';

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
      getAppVersion?: () => Promise<string>;
      minimizeWindow?: () => Promise<void>;
      maximizeWindow?: () => Promise<boolean>;
      closeWindow?: () => Promise<void>;
      forceCloseWindow?: () => Promise<void>;
      onCloseRequested?: (callback: () => void) => () => void;
      isWindowMaximized?: () => Promise<boolean>;
      getSecret?: (key: string) => Promise<string>;
      setSecret?: (key: string, value: string) => Promise<boolean>;
      deleteSecret?: (key: string) => Promise<boolean>;
      updates?: {
        isAutoUpdateSupported: () => Promise<boolean>;
        getUpdateStatus: () => Promise<UpdateStatus>;
        onUpdateStatusChanged: (
          callback: (status: UpdateStatus) => void,
        ) => () => void;
        checkForUpdates: () => Promise<UpdateStatus>;
        downloadUpdate: () => Promise<boolean>;
        installUpdate: () => Promise<boolean>;
        hasUpdated: () => Promise<boolean>;
        setAutoUpdate: (enabled: boolean) => Promise<boolean>;
        setMockState: (state: UpdateMockState) => Promise<boolean>;
      };
      checkForUpdates?: () => Promise<UpdateStatus>;
      downloadUpdate?: () => Promise<boolean>;
      installUpdate?: () => Promise<boolean>;
      onUpdateStatus?: (callback: (status: UpdateStatus) => void) => () => void;
    };
  }

  namespace JSX {
    interface IntrinsicElements {
      webview: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        src?: string;
        allowpopups?: string;
        webpreferences?: string;
        preload?: string;
        partition?: string;
      };
    }
  }
}
