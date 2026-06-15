import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchExtensions } from '../apiClient/fetchExtensions';
import { updateExtension, type ExtensionOperation } from '../apiClient/updateExtension';
import type { ExtensionCommand, ExtensionSnapshot } from './extensionTypes';

interface ExtensionContextValue extends ExtensionSnapshot {
  busyId: string | null;
  error: string | null;
  hasFeature: (feature: string) => boolean;
  refresh: (force?: boolean) => Promise<void>;
  runCommand: (command: ExtensionCommand) => void;
  update: (id: string, operation: ExtensionOperation) => Promise<void>;
}

const emptySnapshot: ExtensionSnapshot = { activeFeatures: [], commands: [], extensions: [] };
const ExtensionContext = createContext<ExtensionContextValue | null>(null);

export function ExtensionProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<ExtensionSnapshot>(emptySnapshot);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (force = false) => {
    try {
      setError(null);
      setSnapshot(await fetchExtensions(force));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Could not load extensions');
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const update = useCallback(async (id: string, operation: ExtensionOperation) => {
    setBusyId(id);
    try {
      setError(null);
      setSnapshot(await updateExtension(id, operation));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Extension operation failed');
      throw nextError;
    } finally {
      setBusyId(null);
    }
  }, []);

  const activeFeatureSet = useMemo(() => new Set(snapshot.activeFeatures), [snapshot.activeFeatures]);
  useEffect(() => {
    (window as any).__blinkcodeExtensionFeatures = activeFeatureSet;
    window.dispatchEvent(new Event('blinkcode:extensionsChanged'));
  }, [activeFeatureSet]);
  const hasFeature = useCallback((feature: string) => activeFeatureSet.has(feature), [activeFeatureSet]);
  const runCommand = useCallback((command: ExtensionCommand) => {
    if (command.action.type === 'showMessage') {
      window.dispatchEvent(new CustomEvent('blinkcode:extensionMessage', { detail: command.action.message }));
    }
    if (command.action.type === 'openSettings') {
      window.dispatchEvent(new Event('blinkcode:openSettings'));
    }
  }, []);

  return (
    <ExtensionContext.Provider value={{ ...snapshot, busyId, error, hasFeature, refresh, runCommand, update }}>
      {children}
    </ExtensionContext.Provider>
  );
}

export function useExtensions() {
  const value = useContext(ExtensionContext);
  if (!value) throw new Error('useExtensions must be within ExtensionProvider');
  return value;
}

export function useExtensionFeature(feature: string) {
  return useExtensions().hasFeature(feature);
}
