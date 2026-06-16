import type { EditorSettings, Keybinding } from '../../types';
import { defaultKeybindings } from '../keybindings/defaultKeybindings';
import { defaultSettings } from './defaultSettings';

export function loadSettings(): EditorSettings {
  try {
    const raw = localStorage.getItem('blinkcode-settings');
    if (raw) {
      const saved = JSON.parse(raw);
      const activityBarIds = new Set(defaultSettings.activityBarOrder);
      const savedActivityBarOrder = Array.isArray(saved.activityBarOrder)
        ? saved.activityBarOrder.filter((id: string) => activityBarIds.has(id as EditorSettings['activityBarOrder'][number]))
        : [];
      const settings = {
        ...defaultSettings,
        ...saved,
        activityBarOrder: [
          ...savedActivityBarOrder,
          ...defaultSettings.activityBarOrder.filter(id => !savedActivityBarOrder.includes(id)),
        ],
        hiddenActivityBarItems: Array.isArray(saved.hiddenActivityBarItems)
          ? saved.hiddenActivityBarItems.filter((id: string) => activityBarIds.has(id as EditorSettings['hiddenActivityBarItems'][number]))
          : [],
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
