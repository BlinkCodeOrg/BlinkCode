import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import type { EditorState } from '../../types';
import { saveStateToServer } from '../../utils/api';
import { getSaveableState } from '../editorState/getSaveableState';
import { getApiSessionAuthorization } from '../apiClient/apiSession';
import { reportRecoverableError } from '../../shared/diagnostics/reportRecoverableError';

export function usePersistEditorState(stateRef: MutableRefObject<EditorState>) {
  const lastSavedRef = useRef('');

  useEffect(() => {
    const persistIfChanged = () => {
      const saveable = getSaveableState(stateRef.current);
      const serialized = JSON.stringify(saveable);
      if (serialized === lastSavedRef.current) return;
      lastSavedRef.current = serialized;
      saveStateToServer(saveable).catch(error => {
        lastSavedRef.current = '';
        reportRecoverableError('workspace.persist-state', error);
      });
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') persistIfChanged();
    };
    const interval = setInterval(persistIfChanged, 10_000);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [stateRef]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const saveable = getSaveableState(stateRef.current);
      const authorization = getApiSessionAuthorization();
      fetch('/api/state', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(authorization ? { Authorization: authorization } : {}),
        },
        body: JSON.stringify(saveable),
        keepalive: true,
      });
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [stateRef]);
}
