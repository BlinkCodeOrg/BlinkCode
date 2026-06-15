import type { Keybinding } from '../../types';
import { MIGRATE_KEYS } from './migrateKeys';

export function migrateKeybindings(kbs: Keybinding[]): Keybinding[] {
  return kbs.map(kb => MIGRATE_KEYS[kb.keys] ? { ...kb, keys: MIGRATE_KEYS[kb.keys] } : kb);
}
