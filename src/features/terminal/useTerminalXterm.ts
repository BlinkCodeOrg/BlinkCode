import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from 'xterm';
import type { IDisposable } from 'xterm';
import type { TerminalInstance } from '../../types';
import { useShell } from '../../hooks/useShell';
import { createTerminalLinkProvider } from './createTerminalLinkProvider';
import { createXtermOptions } from './createXtermOptions';
import { extractUrls } from './extractUrls';

interface UseTerminalXtermParams {
  activeInstance: TerminalInstance | null;
  instances: TerminalInstance[];
  open: boolean;
  panelHeight: number;
  workspaceDir: string;
  onOpenPreview: (url: string) => void;
  updateTerminalCwd: (instanceId: string, cwd: string) => void;
  setTerminalStatus: (instanceId: string, status: TerminalInstance['status'], exitCode?: number) => void;
}

export function useTerminalXterm({
  activeInstance,
  instances,
  onOpenPreview,
  open,
  panelHeight,
  updateTerminalCwd,
  setTerminalStatus,
  workspaceDir,
}: UseTerminalXtermParams) {
  const hostRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const terminalsRef = useRef<Map<string, Terminal>>(new Map());
  const fitAddonsRef = useRef<Map<string, FitAddon>>(new Map());
  const linkProvidersRef = useRef<Map<string, IDisposable>>(new Map());
  const manuallyStoppedRef = useRef<Set<string>>(new Set());
  const [detectedLinks, setDetectedLinks] = useState<Record<string, string[]>>({});

  const shell = useShell({
    updateTerminalCwd,
    onConnected: (instanceId) => {
      if (manuallyStoppedRef.current.has(instanceId)) return;
      setTerminalStatus(instanceId, 'running');
    },
    onData: (instanceId, data) => {
      const matches = extractUrls(data);
      if (matches.length > 0) {
        setDetectedLinks(prev => {
          const existing = prev[instanceId] || [];
          const merged = [...existing];

          for (const match of matches) {
            if (!merged.includes(match)) merged.push(match);
          }

          return {
            ...prev,
            [instanceId]: merged.slice(-6),
          };
        });
      }

      terminalsRef.current.get(instanceId)?.write(data);
    },
    onExit: (instanceId, code) => {
      if (manuallyStoppedRef.current.has(instanceId)) {
        setTerminalStatus(instanceId, 'stopped');
        return;
      }
      setTerminalStatus(instanceId, 'exited', code);
    },
    onError: (instanceId, message) => {
      if (manuallyStoppedRef.current.has(instanceId)) {
        setTerminalStatus(instanceId, 'stopped');
        return;
      }
      terminalsRef.current.get(instanceId)?.writeln(`\r\n${message}`);
      setTerminalStatus(instanceId, 'failed');
    },
  });

  useEffect(() => {
    if (open && activeInstance && !shell.isConnected(activeInstance.id)) {
      shell.connectShell(
        activeInstance.id,
        activeInstance.cwd || workspaceDir,
        activeInstance.startupCommand,
      );
    }
  }, [activeInstance, open, shell, workspaceDir]);

  useEffect(() => {
    if (!open) {
      shell.closeAll();
      instances.forEach(instance => {
        if (instance.status === 'running' || instance.status === 'starting') {
          setTerminalStatus(instance.id, 'stopped');
        }
      });
    }
  }, [instances, open, setTerminalStatus, shell]);

  useEffect(() => {
    const terminals = terminalsRef.current;
    const fitAddons = fitAddonsRef.current;
    const linkProviders = linkProvidersRef.current;

    return () => {
      terminals.forEach(term => term.dispose());
      terminals.clear();
      fitAddons.clear();
      linkProviders.forEach(provider => provider.dispose());
      linkProviders.clear();
      setDetectedLinks({});
      shell.closeAll();
    };
  }, [shell]);

  useLayoutEffect(() => {
    if (!open) return;

    const resizeVisibleTerminals = () => {
      for (const inst of instances) {
        const currentTerm = terminalsRef.current.get(inst.id);
        const currentFit = fitAddonsRef.current.get(inst.id);
        const host = hostRefs.current.get(inst.id);
        if (!currentTerm || !currentFit || !host || host.offsetParent === null) continue;
        currentFit.fit();
        shell.resizeShell(inst.id, currentTerm.cols, currentTerm.rows);
      }
    };

    instances.forEach((inst) => {
      const host = hostRefs.current.get(inst.id);
      if (!host) return;

      let term = terminalsRef.current.get(inst.id);
      let fitAddon = fitAddonsRef.current.get(inst.id);

      if (!term || !fitAddon) {
        term = new Terminal(createXtermOptions());
        fitAddon = new FitAddon();
        term.loadAddon(fitAddon);

        const linkProvider = term.registerLinkProvider(createTerminalLinkProvider(term, onOpenPreview));
        terminalsRef.current.set(inst.id, term);
        fitAddonsRef.current.set(inst.id, fitAddon);
        linkProvidersRef.current.set(inst.id, linkProvider);

        const createdTerm = term;
        createdTerm.attachCustomKeyEventHandler((event) => {
          const isCopy = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c';
          if (isCopy && createdTerm.hasSelection()) {
            const selection = createdTerm.getSelection();
            if (selection) navigator.clipboard?.writeText(selection).catch(() => {});
            return false;
          }
          return true;
        });

        term.onData((data) => {
          shell.sendData(inst.id, data);
        });
      }

      if (!host.hasChildNodes()) {
        term.open(host);
      }

      if (inst.id === activeInstance?.id) {
        fitAddon.fit();
        shell.resizeShell(inst.id, term.cols, term.rows);
        shell.requestCwd(inst.id);
      }
    });

    window.addEventListener('resize', resizeVisibleTerminals);
    resizeVisibleTerminals();
    return () => window.removeEventListener('resize', resizeVisibleTerminals);
  }, [activeInstance?.id, instances, onOpenPreview, open, panelHeight, shell]);

  const closeTerminalShell = useCallback((id: string, status: TerminalInstance['status'] = 'stopped') => {
    manuallyStoppedRef.current.add(id);
    shell.closeShell(id);
    terminalsRef.current.get(id)?.dispose();
    terminalsRef.current.delete(id);
    fitAddonsRef.current.delete(id);
    linkProvidersRef.current.get(id)?.dispose();
    linkProvidersRef.current.delete(id);
    setTerminalStatus(id, status);
    setDetectedLinks(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, [setTerminalStatus, shell]);

  const connectTerminalShell = useCallback((id: string, cwd?: string, command?: string) => {
    manuallyStoppedRef.current.delete(id);
    shell.connectShell(id, cwd, command);
  }, [shell]);

  useEffect(() => {
    const handleStop = (event: Event) => {
      const terminalId = (event as CustomEvent<{ terminalId?: string }>).detail?.terminalId;
      if (terminalId) closeTerminalShell(terminalId);
    };
    window.addEventListener('blinkcode:stopTerminal', handleStop);
    return () => window.removeEventListener('blinkcode:stopTerminal', handleStop);
  }, [closeTerminalShell]);

  const setTerminalHost = (id: string, host: HTMLDivElement | null) => {
    if (host) hostRefs.current.set(id, host);
    else hostRefs.current.delete(id);
  };

  return {
    closeTerminalShell,
    connectShell: connectTerminalShell,
    detectedLinks,
    setTerminalHost,
  };
}
