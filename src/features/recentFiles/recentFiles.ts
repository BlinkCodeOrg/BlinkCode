const STORAGE_KEY = 'blinkcode-recent-files';
const MAX_RECENT_FILES = 30;

export function getRecentFiles(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(value) ? value.filter(item => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export function recordRecentFile(serverPath: string): string[] {
  if (!serverPath || serverPath.startsWith('__')) return getRecentFiles();
  const recent = [serverPath, ...getRecentFiles().filter(item => item !== serverPath)]
    .slice(0, MAX_RECENT_FILES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
  window.dispatchEvent(new CustomEvent('blinkcode:recentFilesChanged', { detail: recent }));
  return recent;
}
