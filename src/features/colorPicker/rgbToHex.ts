import { clamp } from './clamp';
import type { Rgb } from './colorTypes';

export function rgbToHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b].map(part => clamp(Math.round(part), 0, 255).toString(16).padStart(2, '0')).join('')}`;
}
