export function calculateCenteredPan({
  oldZoom,
  newZoom,
  currentPan,
  width,
  height,
}: {
  oldZoom: number;
  newZoom: number;
  currentPan: { x: number; y: number };
  width: number;
  height: number;
}): { x: number; y: number } {
  const cx = width / 2;
  const cy = height / 2;

  return {
    x: cx - (cx - currentPan.x) * (newZoom / oldZoom),
    y: cy - (cy - currentPan.y) * (newZoom / oldZoom),
  };
}
