import { useEffect } from 'react';
import type React from 'react';
import type { MutableRefObject } from 'react';
import { v4 as uuid } from 'uuid';
import type { EditorAction, EditorState } from '../../types';
import {
  clearEditorConfigCache,
  fetchFileContent,
  getFsWsUrl,
} from '../../utils/api';
import { findNodeById } from '../workspaceTree/findNodeById';
import { findNodeByPath } from '../workspaceTree/findNodeByPath';
import { requestConfirmation } from '../../shared/ui/requestConfirmation';
import { t } from '../../utils/i18n';
import {
  authenticatedWebSocketUrl,
  clearApiSession,
} from '../apiClient/apiSession';
import { reportRecoverableError } from '../../shared/diagnostics/reportRecoverableError';

export function useFileSystemWatcher(
  stateRef: MutableRefObject<EditorState>,
  dispatch: React.Dispatch<EditorAction>,
) {
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let batchTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;
    const pendingEvents = new Map<string, any>();

    const handleFileChanged = async (msg: any) => {
      const file = findNodeByPath(stateRef.current.files, msg.path);
      if (!file || file.type !== 'file') return;

      const tab = stateRef.current.openTabs.find((openTab) => {
        const openFile = findNodeById(stateRef.current.files, openTab.fileId);
        return openFile?.serverPath === msg.path;
      });

      if (tab && !file.dirty) {
        fetchFileContent(msg.path)
          .then((content) => {
            dispatch({
              type: 'SET_FILE_CONTENT',
              payload: { fileId: tab.fileId, content },
            });
          })
          .catch((error) =>
            reportRecoverableError('watcher.reload-file', error, {
              path: msg.path,
            }),
          );
      } else if (tab && file.dirty) {
        const tt = (key: string, values?: Record<string, string | number>) =>
          t(key, stateRef.current.settings.language, values);
        const reload = await requestConfirmation({
          cancelLabel: tt('watcher.keepChanges'),
          confirmLabel: tt('watcher.reload'),
          danger: true,
          details: msg.path,
          message: tt('watcher.changedMessage', { name: msg.name }),
          title: tt('watcher.changedTitle'),
        });
        if (reload) {
          fetchFileContent(msg.path)
            .then((content) => {
              dispatch({
                type: 'SET_FILE_CONTENT',
                payload: { fileId: tab.fileId, content },
              });
              dispatch({
                type: 'MARK_FILE_SAVED',
                payload: { fileId: tab.fileId },
              });
            })
            .catch((error) =>
              reportRecoverableError('watcher.reload-dirty-file', error, {
                path: msg.path,
              }),
            );
        } else {
          const id = uuid();
          dispatch({
            type: 'ADD_TOAST',
            payload: {
              id,
              message: tt('watcher.keptChanges', { name: msg.name }),
              type: 'info',
            },
          });
          setTimeout(
            () => dispatch({ type: 'REMOVE_TOAST', payload: { id } }),
            5000,
          );
        }
      }
    };

    const flushEvents = () => {
      batchTimer = null;
      const events = [...pendingEvents.values()];
      pendingEvents.clear();
      if (events.length > 0) {
        window.dispatchEvent(
          new CustomEvent('blinkcode:fileSystemChanged', { detail: events }),
        );
      }
      for (const msg of events) {
        if (
          msg.path === '.editorconfig' ||
          msg.path?.endsWith('/.editorconfig')
        ) {
          clearEditorConfigCache();
        }
        if (msg.type === 'add') {
          dispatch({
            type: 'FS_ADD_NODE',
            payload: { serverPath: msg.path, name: msg.name, type: 'file' },
          });
        } else if (msg.type === 'addDir') {
          dispatch({
            type: 'FS_ADD_NODE',
            payload: { serverPath: msg.path, name: msg.name, type: 'folder' },
          });
        } else if (msg.type === 'unlink' || msg.type === 'unlinkDir') {
          dispatch({
            type: 'FS_REMOVE_NODE',
            payload: { serverPath: msg.path },
          });
        } else if (msg.type === 'change') {
          void handleFileChanged(msg);
        }
      }
    };

    const connect = async () => {
      try {
        ws = new WebSocket(await authenticatedWebSocketUrl(getFsWsUrl()));
        ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data);
            if (typeof msg.path !== 'string' || typeof msg.type !== 'string')
              return;
            pendingEvents.set(`${msg.type}:${msg.path}`, msg);
            if (!batchTimer) batchTimer = setTimeout(flushEvents, 100);
          } catch (error) {
            reportRecoverableError('watcher.message', error);
          }
        };
        ws.onclose = () => {
          ws = null;
          if (disposed) return;
          clearApiSession();
          reconnectTimer = setTimeout(() => void connect(), 2000);
        };
        ws.onerror = () => {
          ws?.close();
        };
      } catch (error) {
        reportRecoverableError('watcher.connect', error);
        reconnectTimer = setTimeout(() => void connect(), 2000);
      }
    };

    void connect();
    return () => {
      disposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (batchTimer) clearTimeout(batchTimer);
      ws?.close();
    };
  }, [dispatch, stateRef]);
}
