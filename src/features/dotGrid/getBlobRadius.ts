import { DOT_GRID_BASE_RADIUS, DOT_GRID_WOBBLE } from './dotGridConstants';

export function getBlobRadius(angle: number, time: number): number {
  return DOT_GRID_BASE_RADIUS
    + DOT_GRID_WOBBLE * 0.25 * Math.sin(angle * 2 + time * 0.7)
    + DOT_GRID_WOBBLE * 0.20 * Math.cos(angle * 3 - time * 1.1)
    + DOT_GRID_WOBBLE * 0.15 * Math.sin(angle * 5 + time * 0.9)
    + DOT_GRID_WOBBLE * 0.12 * Math.cos(angle * 7 - time * 1.3)
    + DOT_GRID_WOBBLE * 0.10 * Math.sin(angle * 11 + time * 0.5)
    + DOT_GRID_WOBBLE * 0.08 * Math.cos(angle * 13 - time * 1.7)
    + DOT_GRID_WOBBLE * 0.05 * Math.sin(angle * 17 + time * 2.1)
    + DOT_GRID_WOBBLE * 0.05 * Math.cos(angle * 19 - time * 0.8);
}
