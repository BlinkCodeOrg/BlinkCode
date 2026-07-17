import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useEditor } from '../../store/EditorContext';
import type { UpdateStatus } from '../../features/updates/types';

interface AppUpdatesContextValue {
  updateStatus: UpdateStatus | null;
  isCheckingForUpdates: boolean;
  isDownloadingUpdate: boolean;
  isInstallingUpdate: boolean;
  isAutoUpdateSupported: boolean;
  hasUpdated: boolean;
  checkForUpdates: () => Promise<boolean>;
  downloadUpdate: () => Promise<boolean>;
  installUpdate: () => Promise<boolean>;
}

const AppUpdatesContext = createContext<AppUpdatesContextValue | null>(null);

export function AppUpdatesProvider({ children }: { children: ReactNode }) {
  const { state } = useEditor();
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [isAutoUpdateSupported, setSupported] = useState(false);
  const [hasUpdated, setHasUpdated] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const api = window.electronAPI?.updates;
    if (!api)
      return () => {
        mounted.current = false;
      };
    const unsubscribe = api.onUpdateStatusChanged((status) => {
      if (mounted.current) setUpdateStatus(status);
    });
    void Promise.all([
      api.getUpdateStatus(),
      api.isAutoUpdateSupported(),
      api.hasUpdated(),
    ])
      .then(([status, supported, updated]) => {
        if (!mounted.current) return;
        setUpdateStatus(status);
        setSupported(supported);
        setHasUpdated(updated);
      })
      .catch((error) =>
        console.error('Failed to initialize app updates', error),
      );
    return () => {
      mounted.current = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    void window.electronAPI?.updates
      ?.setAutoUpdate(state.settings.autoUpdate)
      .catch((error) =>
        console.error('Failed to update automatic update setting', error),
      );
  }, [state.settings.autoUpdate]);

  const checkForUpdates = useCallback(async () => {
    try {
      const status = await window.electronAPI?.updates?.checkForUpdates();
      if (status && mounted.current) setUpdateStatus(status);
      return (
        status?.phase === 'available' ||
        status?.phase === 'downloading' ||
        status?.phase === 'downloaded'
      );
    } catch (error) {
      console.error('Failed to check for updates', error);
      return false;
    }
  }, []);

  const downloadUpdate = useCallback(async () => {
    try {
      return (await window.electronAPI?.updates?.downloadUpdate()) ?? false;
    } catch (error) {
      console.error('Failed to download update', error);
      return false;
    }
  }, []);

  const installUpdate = useCallback(async () => {
    try {
      return (await window.electronAPI?.updates?.installUpdate()) ?? false;
    } catch (error) {
      console.error('Failed to install update', error);
      return false;
    }
  }, []);

  const value = useMemo<AppUpdatesContextValue>(
    () => ({
      updateStatus,
      isCheckingForUpdates: updateStatus?.phase === 'checking',
      isDownloadingUpdate: updateStatus?.phase === 'downloading',
      isInstallingUpdate: updateStatus?.phase === 'installing',
      isAutoUpdateSupported,
      hasUpdated,
      checkForUpdates,
      downloadUpdate,
      installUpdate,
    }),
    [
      checkForUpdates,
      downloadUpdate,
      hasUpdated,
      installUpdate,
      isAutoUpdateSupported,
      updateStatus,
    ],
  );

  return (
    <AppUpdatesContext.Provider value={value}>
      {children}
    </AppUpdatesContext.Provider>
  );
}

export function useAppUpdates() {
  const context = useContext(AppUpdatesContext);
  if (!context)
    throw new Error('useAppUpdates must be used inside AppUpdatesProvider');
  return context;
}
