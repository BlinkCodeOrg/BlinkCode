import type { ImportedTheme } from '../../types';

export function convertVsCodeTheme(value: unknown): ImportedTheme {
  const source = value as Record<string, any>;
  if (!source || typeof source !== 'object') throw new Error('Theme JSON must be an object');
  const type = source.type === 'light' ? 'light' : 'dark';
  const colors = source.colors && typeof source.colors === 'object' ? source.colors : {};
  const tokenColors = Array.isArray(source.tokenColors) ? source.tokenColors : [];
  if (!tokenColors.length && !Object.keys(colors).length) {
    throw new Error('Theme does not contain colors or tokenColors');
  }
  return {
    name: String(source.name || 'Imported theme'),
    type,
    colors,
    tokenColors: tokenColors.map(item => ({
      scope: item.scope,
      settings: item.settings || {},
    })),
  };
}
