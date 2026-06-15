import { useMemo } from 'react';
import { scoreCommandSearch } from '../search/scoreCommandSearch';
import type { Command } from './commandTypes';

export function useFilteredCommands(commands: Command[], query: string): Command[] {
  return useMemo(() => {
    if (!query.trim()) return commands;
    const scored = commands
      .map(cmd => {
        const hay = `${cmd.category} ${cmd.title}`;
        const score = scoreCommandSearch(query.trim(), hay);
        return { cmd, score };
      })
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score);
    return scored.map(result => result.cmd);
  }, [commands, query]);
}
