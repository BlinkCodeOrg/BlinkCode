import { Redo2, Undo2 } from 'lucide-react';
import type { Command } from './commandTypes';
import type { CommandPaletteCommandContext } from './commandPaletteCommandContext';

export function createEditCommands({
  tt,
  triggerEditorAction,
}: CommandPaletteCommandContext): Command[] {
  return [
    {
      id: 'edit.undo',
      title: tt('command.editUndo'),
      category: 'Edit',
      icon: <Undo2 size={14} />,
      shortcut: 'Ctrl+Z',
      run: () => triggerEditorAction('undo'),
    },
    {
      id: 'edit.redo',
      title: tt('command.editRedo'),
      category: 'Edit',
      icon: <Redo2 size={14} />,
      shortcut: 'Ctrl+Shift+Z',
      run: () => triggerEditorAction('redo'),
    },
  ];
}
