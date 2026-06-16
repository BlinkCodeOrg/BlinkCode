import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import type { ExtensionOperation } from '../apiClient/updateExtension';
import type { ExtensionCommand, ExtensionSnapshot } from './extensionTypes';

interface ExtensionContextValue extends ExtensionSnapshot {
  busyId: string | null;
  error: string | null;
  hasFeature: (feature: string) => boolean;
  refresh: (force?: boolean) => Promise<void>;
  runCommand: (command: ExtensionCommand) => void;
  update: (id: string, operation: ExtensionOperation) => Promise<void>;
}

const bundledFeatures = ['markdown-preview', 'spell-checker', 'theme-import'];
const emptySnapshot: ExtensionSnapshot = { activeFeatures: bundledFeatures, commands: [], extensions: [] };
const ExtensionContext = createContext<ExtensionContextValue | null>(null);

export function ExtensionProvider({ children }: { children: ReactNode }) {
  const refresh = useCallback(async (force = false) => {
    void force;
  }, []);

  const update = useCallback(async (id: string, operation: ExtensionOperation) => {
    void id;
    void operation;
  }, []);

  const activeFeatureSet = useMemo(() => new Set(emptySnapshot.activeFeatures), []);
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
    <ExtensionContext.Provider value={{ ...emptySnapshot, busyId: null, error: null, hasFeature, refresh, runCommand, update }}>
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
