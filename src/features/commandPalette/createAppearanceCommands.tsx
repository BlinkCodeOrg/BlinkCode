import { Monitor, Moon, Palette, Sun } from 'lucide-react';
import { commandThemes } from './commandThemes';
import type { Command } from './commandTypes';
import type { CommandPaletteCommandContext } from './commandPaletteCommandContext';

export function createAppearanceCommands({
  settings,
  tt,
  updateSettings,
}: CommandPaletteCommandContext): Command[] {
  return [
    {
      id: 'appearance.colorSchemeDark',
      title: tt('command.appearanceDark'),
      category: 'Appearance',
      icon: <Moon size={14} />,
      when: () => settings.colorScheme !== 'dark',
      run: () => updateSettings({ colorScheme: 'dark' }),
    },
    {
      id: 'appearance.colorSchemeLight',
      title: tt('command.appearanceLight'),
      category: 'Appearance',
      icon: <Sun size={14} />,
      when: () => settings.colorScheme !== 'light',
      run: () => updateSettings({ colorScheme: 'light' }),
    },
    {
      id: 'appearance.colorSchemeSystem',
      title: tt('command.appearanceSystem'),
      category: 'Appearance',
      icon: <Monitor size={14} />,
      when: () => settings.colorScheme !== 'system',
      run: () => updateSettings({ colorScheme: 'system' }),
    },
    ...commandThemes.filter(t => t.id !== settings.theme).map<Command>(t => ({
      id: `appearance.theme.${t.id}`,
      title: tt('command.theme', { theme: t.label }),
      category: 'Appearance',
      icon: <Palette size={14} />,
      run: () => updateSettings({ theme: t.id }),
    })),
  ];
}
