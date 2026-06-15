export function formatDiscardConfirmMessage(paths: string[], tt: (key: string, args?: Record<string, string | number>) => string): string {
  if (paths.length === 1) {
    return tt('sc.discardConfirmOne', { path: paths[0] });
  }

  return tt('sc.discardConfirmMany', { count: paths.length });
}
