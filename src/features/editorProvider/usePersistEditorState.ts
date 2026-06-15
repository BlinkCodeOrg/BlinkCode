import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import type { EditorState } from '../../types';
import { saveStateToServer } from '../../utils/api';
import { getSaveableState } from '../editorState/getSaveableState';

export function usePersistEditorState(stateRef: MutableRefObject<EditorState>) {
  const lastSavedRef = useRef('');

  useEffect(() => {
    const persistIfChanged = () => {
      const saveable = getSaveableState(stateRef.current);
      const serialized = JSON.stringify(saveable);
      if (serialized === lastSavedRef.current) return;
      lastSavedRef.current = serialized;
      saveStateToServer(saveable).catch(() => {
        lastSavedRef.current = '';
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
      fetch('/api/state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveable),
        keepalive: true,
      });
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [stateRef]);
}
