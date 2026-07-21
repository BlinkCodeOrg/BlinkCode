import { useCallback, useMemo, useRef } from 'react';
import { getWsUrl } from '../utils/api';
import {
  authenticatedWebSocketUrl,
  clearApiSession,
} from '../features/apiClient/apiSession';

interface WsMapEntry {
  ws: WebSocket;
}

interface ShellActions {
  updateTerminalCwd: (instanceId: string, cwd: string) => void;
  onData: (instanceId: string, data: string) => void;
  onExit: (instanceId: string, code: number) => void;
  onError: (instanceId: string, message: string) => void;
  onConnected?: (instanceId: string) => void;
}

export function useShell(actions: ShellActions) {
  const wsMap = useRef<Map<string, WsMapEntry>>(new Map());
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  const connectShell = useCallback(
    async (instanceId: string, cwd?: string, command?: string) => {
      const old = wsMap.current.get(instanceId);
      if (old) {
        old.ws.close();
        wsMap.current.delete(instanceId);
      }

      try {
        const ws = new WebSocket(await authenticatedWebSocketUrl(getWsUrl()));
        wsMap.current.set(instanceId, { ws });

        let connected = false;
        ws.onopen = () => {
          ws.send(JSON.stringify({ type: 'start', cwd, command }));
        };

        ws.onmessage = (e) => {
          try {
            const msg = JSON.parse(e.data);
            if (msg.type === 'ready') {
              actionsRef.current.updateTerminalCwd(instanceId, msg.cwd || '');
              if (!connected) {
                connected = true;
                actionsRef.current.onConnected?.(instanceId);
              }
            } else if (msg.type === 'output') {
              actionsRef.current.onData(instanceId, msg.data || '');
            } else if (msg.type === 'exit') {
              actionsRef.current.onExit(instanceId, Number(msg.code || 0));
            } else if (msg.type === 'error') {
              actionsRef.current.onError(
                instanceId,
                msg.data || 'Shell connection failed',
              );
            }
          } catch {}
        };

        ws.onerror = () => {
          actionsRef.current.onError(instanceId, 'Shell connection failed');
        };

        ws.onclose = () => {
          wsMap.current.delete(instanceId);
          if (!connected) clearApiSession();
        };
      } catch {
        clearApiSession();
        actionsRef.current.onError(instanceId, 'WebSocket not available');
      }
    },
    [],
  );

  const sendData = useCallback((instanceId: string, data: string) => {
    const entry = wsMap.current.get(instanceId);
    if (entry?.ws && entry.ws.readyState === WebSocket.OPEN) {
      entry.ws.send(JSON.stringify({ type: 'input', data }));
      return true;
    }
    return false;
  }, []);

  const resizeShell = useCallback(
    (instanceId: string, cols: number, rows: number) => {
      const entry = wsMap.current.get(instanceId);
      if (entry?.ws && entry.ws.readyState === WebSocket.OPEN) {
        entry.ws.send(JSON.stringify({ type: 'resize', cols, rows }));
      }
    },
    [],
  );

  const requestCwd = useCallback((instanceId: string) => {
    const entry = wsMap.current.get(instanceId);
    if (entry?.ws && entry.ws.readyState === WebSocket.OPEN) {
      entry.ws.send(JSON.stringify({ type: 'cwd' }));
    }
  }, []);

  const closeShell = useCallback((instanceId: string) => {
    const entry = wsMap.current.get(instanceId);
    if (entry) {
      if (entry.ws.readyState === WebSocket.OPEN) {
        entry.ws.send(JSON.stringify({ type: 'kill' }));
      }
      entry.ws.close();
      wsMap.current.delete(instanceId);
    }
  }, []);

  const closeAll = useCallback(() => {
    wsMap.current.forEach((e) => e.ws.close());
    wsMap.current.clear();
  }, []);

  const isConnected = useCallback((instanceId: string) => {
    const entry = wsMap.current.get(instanceId);
    return entry?.ws.readyState === WebSocket.OPEN;
  }, []);

  return useMemo(
    () => ({
      closeAll,
      closeShell,
      connectShell,
      isConnected,
      requestCwd,
      resizeShell,
      sendData,
    }),
    [
      closeAll,
      closeShell,
      connectShell,
      isConnected,
      requestCwd,
      resizeShell,
      sendData,
    ],
  );
}
