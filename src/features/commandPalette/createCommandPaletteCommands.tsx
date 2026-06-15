import { createAppearanceCommands } from './createAppearanceCommands';
import { createAiCommands } from './createAiCommands';
import { createBrowserCommands } from './createBrowserCommands';
import type { CreateCommandPaletteCommandsParams } from './commandPaletteCommandContext';
import { createEditCommands } from './createEditCommands';
import { createFileCommands } from './createFileCommands';
import { createNavigationCommands } from './createNavigationCommands';
import { createViewCommands } from './createViewCommands';
import type { Command } from './commandTypes';

export function createCommandPaletteCommands(params: CreateCommandPaletteCommandsParams): Command[] {
  const context = {
    ...params,
    activeTab: params.state.openTabs.find(t => t.id === params.state.activeTabId),
    settings: params.state.settings,
  };

  const list: Command[] = [
    ...createViewCommands(context),
    ...createFileCommands(context),
    ...createEditCommands(context),
    ...createNavigationCommands(context),
    ...createAppearanceCommands(context),
    ...createBrowserCommands(context),
    ...createAiCommands(context),
  ];

  return list.filter(command => (command.when ? command.when() : true));
}
