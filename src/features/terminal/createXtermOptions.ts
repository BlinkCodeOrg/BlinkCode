import type { ITerminalOptions } from 'xterm';

export function createXtermOptions(): ITerminalOptions {
  return {
    convertEol: true,
    cursorBlink: true,
    fontFamily: `'JetBrains Mono', monospace`,
    fontSize: 12,
    theme: {
      background: '#0d0f14',
      foreground: '#c8d0dc',
      cursor: '#4f8cff',
      selectionBackground: 'rgba(79, 140, 255, 0.25)',
      black: '#0d0f14',
      red: '#ef4444',
      green: '#22c55e',
      yellow: '#f59e0b',
      blue: '#4f8cff',
      magenta: '#a78bfa',
      cyan: '#67e8f9',
      white: '#e5e7eb',
      brightBlack: '#6b7280',
      brightRed: '#f87171',
      brightGreen: '#4ade80',
      brightYellow: '#fbbf24',
      brightBlue: '#60a5fa',
      brightMagenta: '#c4b5fd',
      brightCyan: '#a5f3fc',
      brightWhite: '#f9fafb',
    },
  };
}
