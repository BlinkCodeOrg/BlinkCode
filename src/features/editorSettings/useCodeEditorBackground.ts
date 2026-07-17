import type { CSSProperties } from 'react';
import type { EditorSettings } from '../../types';
import { getOfficialEditorBackgroundSrc } from './editorBackgrounds';

export function useCodeEditorBackground(settings: EditorSettings) {
  const image =
    settings.editorBackgroundPreset === 'custom'
      ? settings.editorBackgroundCustom || ''
      : getOfficialEditorBackgroundSrc(settings.editorBackgroundPreset);
  const hasBackground = Boolean(image);
  const style = hasBackground
    ? ({
        '--editor-bg-image': `url("${image}")`,
        '--editor-bg-opacity': String(
          Math.max(0, Math.min(100, settings.editorBackgroundOpacity)) / 100,
        ),
        '--editor-bg-blur': `${Math.max(0, Math.min(16, settings.editorBackgroundBlur))}px`,
        '--editor-bg-scale': String(
          Math.max(100, Math.min(140, settings.editorBackgroundScale)) / 100,
        ),
        '--editor-bg-brightness': String(
          Math.max(45, Math.min(115, settings.editorBackgroundBrightness)) /
            100,
        ),
      } as CSSProperties)
    : undefined;

  return {
    isSolid: settings.backgroundStyle === 'solid',
    hasBackground,
    style,
  };
}
