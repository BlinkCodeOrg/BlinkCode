import monacoBg1 from '../../assets/bg/monaco-bg1.svg';
import monacoBg2 from '../../assets/bg/monaco-bg2.svg';
import monacoBg3 from '../../assets/bg/monaco-bg3.svg';
import monacoBg4 from '../../assets/bg/monaco-bg4.svg';
import monacoBg5 from '../../assets/bg/monaco-bg5.svg';
import monacoBg6 from '../../assets/bg/monaco-bg6.svg';

export const officialEditorBackgrounds = [
  { id: 'blink-bg-1', labelKey: 'editorBackground.blinkBg1', src: monacoBg1 },
  { id: 'blink-bg-2', labelKey: 'editorBackground.blinkBg2', src: monacoBg2 },
  { id: 'blink-bg-3', labelKey: 'editorBackground.blinkBg3', src: monacoBg3 },
  { id: 'blink-bg-4', labelKey: 'editorBackground.blinkBg4', src: monacoBg4 },
  { id: 'blink-bg-5', labelKey: 'editorBackground.blinkBg5', src: monacoBg5 },
  { id: 'blink-bg-6', labelKey: 'editorBackground.blinkBg6', src: monacoBg6 },
] as const;

export type OfficialEditorBackgroundId = typeof officialEditorBackgrounds[number]['id'];
export type EditorBackgroundPreset = 'none' | OfficialEditorBackgroundId | 'custom';

const legacyEditorBackgroundAliases: Record<string, OfficialEditorBackgroundId> = {
  aurora: 'blink-bg-1',
  blueprint: 'blink-bg-2',
  midnight: 'blink-bg-3',
};

export function normalizeEditorBackgroundPreset(preset: string): EditorBackgroundPreset {
  if (preset === 'none' || preset === 'custom') return preset;
  if (officialEditorBackgrounds.some(background => background.id === preset)) {
    return preset as OfficialEditorBackgroundId;
  }
  return legacyEditorBackgroundAliases[preset] || 'none';
}

export function getOfficialEditorBackgroundSrc(preset: string) {
  const normalizedPreset = normalizeEditorBackgroundPreset(preset);
  return officialEditorBackgrounds.find(background => background.id === normalizedPreset)?.src || '';
}
