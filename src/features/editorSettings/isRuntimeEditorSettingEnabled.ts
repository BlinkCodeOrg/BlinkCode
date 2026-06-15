import type { EditorSettings } from '../../types';

export function isRuntimeEditorSettingEnabled(key: keyof EditorSettings): boolean {
  return Boolean((window as any).__blinkcodeSettings?.[key]);
}
