import type { ITerminalOptions } from 'xterm';

function readCssVar(styles: CSSStyleDeclaration, name: string, fallback: string) {
  const value = styles.getPropertyValue(name).trim();
  return value || fallback;
}

export function createXtermTheme() {
  const styles = getComputedStyle(document.documentElement);
  const background = readCssVar(styles, '--bg-terminal', '#0d0f14');
  const foreground = readCssVar(styles, '--terminal-text', '#c8d0dc');
  const accent = readCssVar(styles, '--accent', '#4f8cff');
  const selection = readCssVar(styles, '--accent-selection', 'rgba(79, 140, 255, 0.25)');
  return {
    background,
    foreground,
    cursor: accent,
    selectionBackground: selection,
    black: '#0d0f14',
    red: '#ef4444',
    green: '#22c55e',
    yellow: '#f59e0b',
    blue: accent,
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
  };
}

export function createXtermOptions(): ITerminalOptions {
  return {
    convertEol: true,
    cursorBlink: true,
    fontFamily: `'JetBrains Mono', monospace`,
    fontSize: 12,
    lineHeight: 1.18,
    scrollback: 8000,
    theme: createXtermTheme(),
  };
}
