export async function isWindowMaximized(): Promise<boolean | null> {
  const api = (window as any).electronAPI;
  if (!api?.isWindowMaximized) return null;

  try {
    return await api.isWindowMaximized();
  } catch {
    return null;
  }
}
