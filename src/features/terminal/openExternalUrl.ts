export function openExternalUrl(url: string): void {
  const electronApi = (window as any).electronAPI;
  if (electronApi?.openExternal) {
    electronApi.openExternal(url).catch(() => {});
    return;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
}
