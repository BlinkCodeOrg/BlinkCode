import type { EditorSettings, Keybinding } from '../../types';
import { defaultKeybindings } from '../keybindings/defaultKeybindings';
import { defaultSettings } from './defaultSettings';

export function loadSettings(): EditorSettings {
  try {
    const raw = localStorage.getItem('blinkcode-settings');
    if (raw) {
      const saved = JSON.parse(raw);
      const settings = {
        ...defaultSettings,
        ...saved,
        activityBarOrder: Array.isArray(saved.activityBarOrder) ? saved.activityBarOrder : defaultSettings.activityBarOrder,
        hiddenActivityBarItems: Array.isArray(saved.hiddenActivityBarItems) ? saved.hiddenActivityBarItems : [],
        panelWidths: { ...defaultSettings.panelWidths, ...(saved.panelWidths || {}) },
      };
      if (saved.keybindings) {
        const merged = defaultKeybindings.map(dk => {
          const sk = saved.keybindings.find((k: Keybinding) => k.id === dk.id);
          return sk ? { ...dk, keys: sk.keys } : dk;
        });
        settings.keybindings = merged;
      }
      return settings;
    }
  } catch {}

  return { ...defaultSettings };
}
