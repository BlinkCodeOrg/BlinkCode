import type { EditorSettings, EditorState } from '../../types';
import { saveSettingsToServer } from '../../utils/api';

export function updateSettingsInState(
  state: EditorState,
  patch: Partial<EditorSettings>,
): EditorState {
  const settings = {
    ...state.settings,
    ...patch,
    panelWidths: patch.panelWidths
      ? { ...state.settings.panelWidths, ...patch.panelWidths }
      : state.settings.panelWidths,
  };
  try { localStorage.setItem('blinkcode-settings', JSON.stringify(settings)); } catch {}
  const { keybindings: _keybindings, ...settingsWithoutKeybindings } = settings;
  saveSettingsToServer(settingsWithoutKeybindings).catch(() => {});
  return { ...state, settings };
}
