import type { TerminalInstance } from '../../types';

export function isTerminalRunning(terminal?: TerminalInstance | null): boolean {
  return terminal?.status === 'starting' || terminal?.status === 'running';
}

export function findScriptTerminal(
  terminals: TerminalInstance[],
  packageDirectory: string,
  scriptName: string,
): TerminalInstance | null {
  return terminals.find(item => item.scriptKey === `${packageDirectory}:${scriptName}`) || null;
}
