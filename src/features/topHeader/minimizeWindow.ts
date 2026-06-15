export async function minimizeWindow(): Promise<void> {
  try {
    await (window as any).electronAPI?.minimizeWindow?.();
  } catch {}
}
