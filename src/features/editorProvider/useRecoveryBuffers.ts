import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import type { EditorState } from '../../types';
import { saveRecoveryBuffer } from '../../utils/api';
import { findNodeById } from '../workspaceTree/findNodeById';

export function useRecoveryBuffers(stateRef: MutableRefObject<EditorState>, state: EditorState) {
  const savedContentRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    const persistDirtyBuffers = () => {
      const current = stateRef.current;

      for (const tab of current.openTabs) {
        const file = findNodeById(current.files, tab.fileId);
        if (!file?.dirty || file.content === undefined || !file.serverPath || file.serverPath.startsWith('__')) continue;
        if (savedContentRef.current.get(file.serverPath) === file.content) continue;

        savedContentRef.current.set(file.serverPath, file.content);
        saveRecoveryBuffer(file.serverPath, file.content).catch(() => {
          savedContentRef.current.delete(file.serverPath!);
        });
      }
    };

    const timeout = window.setTimeout(persistDirtyBuffers, 1500);
    return () => window.clearTimeout(timeout);
  }, [state, stateRef]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const current = stateRef.current;
      let hasDirtyFiles = false;
      for (const tab of current.openTabs) {
        const file = findNodeById(current.files, tab.fileId);
        if (!file?.dirty || file.content === undefined || !file.serverPath || file.serverPath.startsWith('__')) continue;
        hasDirtyFiles = true;
        fetch('/api/recovery', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath: file.serverPath, content: file.content }),
          keepalive: true,
        });
      }
      if (hasDirtyFiles) {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [stateRef]);
}
