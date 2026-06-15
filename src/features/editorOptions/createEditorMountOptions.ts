import type { EditorSettings } from '../../types';
import { createEditorLiveOptions } from './createEditorLiveOptions';

export function createEditorMountOptions(settings: EditorSettings): Record<string, unknown> {
  return {
    ...createEditorLiveOptions(settings),
    lineHeight: Math.round(settings.fontSize * 1.7),
    scrollBeyondLastLine: false,
    renderLineHighlight: 'line',
    padding: { top: 16 },
    overviewRulerBorder: false,
    hideCursorInOverviewRuler: true,
    overviewRulerLanes: 3,
    scrollbar: { verticalScrollbarSize: 5, horizontalScrollbarSize: 5, vertical: 'auto', horizontal: 'auto' },
    wordBasedSuggestions: 'off',
    suggest: { showWords: false },
  };
}
