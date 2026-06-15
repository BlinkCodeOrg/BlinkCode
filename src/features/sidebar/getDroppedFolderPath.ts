export function getDroppedFolderPath(dataTransfer: DataTransfer): string | null {
  if (dataTransfer.items.length !== 1) return null;
  const item = dataTransfer.items[0];
  const entry = item.webkitGetAsEntry?.();
  if (!entry?.isDirectory) return null;
  const file = item.getAsFile();
  return file ? window.electronAPI?.getPathForFile?.(file) || null : null;
}
