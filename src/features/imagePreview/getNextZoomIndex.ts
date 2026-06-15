export function getNextZoomIndex(currentIndex: number, direction: 1 | -1, zoomLevelsLength: number): number {
  if (direction > 0) return Math.min(zoomLevelsLength - 1, currentIndex + 1);
  return Math.max(0, currentIndex - 1);
}
