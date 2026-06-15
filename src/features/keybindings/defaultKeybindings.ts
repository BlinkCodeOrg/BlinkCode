import type { Keybinding } from '../../types';
import { commandRegistry } from '../commands/commandRegistry';

export const defaultKeybindings: Keybinding[] = commandRegistry.map(command => ({
  id: command.id,
  label: `kb.${command.id}`,
  keys: command.defaultKeys,
}));
