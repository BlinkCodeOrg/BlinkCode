export function getMonacoTheme(theme: string, colorScheme: string): string {
  if (theme === 'imported') return 'blinkcode-imported';
  const isLight = colorScheme === 'light' || (colorScheme === 'system' && window.matchMedia('(prefers-color-scheme: light)').matches);
  return isLight ? `blinkcode-${theme}-light` : `blinkcode-${theme}`;
}
