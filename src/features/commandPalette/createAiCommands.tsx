import { Bot } from 'lucide-react';
import { AI_QUICK_ACTIONS } from '../ai/aiQuickActions';
import type { CommandPaletteCommandContext } from './commandPaletteCommandContext';
import type { Command } from './commandTypes';

export function createAiCommands({ state, toggleAIPanel, tt }: CommandPaletteCommandContext): Command[] {
  return AI_QUICK_ACTIONS.map(action => ({
    id: `ai.${action.id}`,
    title: `AI: ${tt(action.labelKey)}`,
    category: 'AI',
    icon: <Bot size={14} />,
    run: () => {
      if (!state.showAIPanel) toggleAIPanel();
      window.dispatchEvent(new CustomEvent('blinkcode:aiQuickAction', {
        detail: { action: action.id },
      }));
    },
  }));
}
