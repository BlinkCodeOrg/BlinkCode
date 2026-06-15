import { Globe } from 'lucide-react';
import type { Command } from './commandTypes';
import type { CommandPaletteCommandContext } from './commandPaletteCommandContext';

export function createBrowserCommands({
  closeBrowserPreview,
  state,
  tt,
}: CommandPaletteCommandContext): Command[] {
  return [
    {
      id: 'browser.close',
      title: tt('command.browserClose'),
      category: 'Browser',
      icon: <Globe size={14} />,
      when: () => state.browserOpen,
      run: () => closeBrowserPreview(),
    },
  ];
}
