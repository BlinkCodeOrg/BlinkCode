export async function getNativeFolderPath(): Promise<string | null> {
  const api = (window as any).electronAPI || (window as any).electron || (window as any).desktop;
  if (!api) return null;

  const picker = api.openFolder || api.pickFolder || api.selectFolder;
  if (typeof picker !== 'function') return null;

  try {
    const result = await picker();
    if (typeof result === 'string') return result;
    if (result && typeof result.path === 'string') return result.path;
    if (result && Array.isArray(result.paths) && typeof result.paths[0] === 'string') return result.paths[0];
  } catch {}

  return null;
}
