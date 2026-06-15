import { ArrowRight, Search } from 'lucide-react';
import type { Command } from './commandTypes';
import type { CommandPaletteCommandContext } from './commandPaletteCommandContext';

export function createNavigationCommands({
  activeTab,
  runMonacoAction,
  tt,
}: CommandPaletteCommandContext): Command[] {
  return [
    {
      id: 'nav.gotoLine',
      title: tt('command.goToLine'),
      category: 'Navigation',
      icon: <ArrowRight size={14} />,
      shortcut: 'Ctrl+G',
      when: () => Boolean(activeTab),
      run: () => runMonacoAction('editor.action.gotoLine'),
    },
    {
      id: 'nav.find',
      title: tt('command.find'),
      category: 'Navigation',
      icon: <Search size={14} />,
      shortcut: 'Ctrl+F',
      when: () => Boolean(activeTab),
      run: () => runMonacoAction('actions.find'),
    },
    {
      id: 'nav.replace',
      title: tt('command.replace'),
      category: 'Navigation',
      icon: <Search size={14} />,
      shortcut: 'Ctrl+H',
      when: () => Boolean(activeTab),
      run: () => runMonacoAction('editor.action.startFindReplaceAction'),
    },
  ];
}
