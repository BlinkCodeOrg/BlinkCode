export async function toggleMaximizeWindow(): Promise<boolean | null> {
  try {
    const next = await (window as any).electronAPI?.maximizeWindow?.();
    return typeof next === 'boolean' ? next : null;
  } catch {
    return null;
  }
}
