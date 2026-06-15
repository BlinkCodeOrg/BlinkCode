export function formatGitActionError(
  action: 'commit' | 'pull' | 'push',
  err: unknown,
  tt: (key: string, args?: Record<string, string | number>) => string,
): string {
  const raw = String((err as any)?.message || '').toLowerCase();

  if (action === 'commit' && raw.includes('author identity unknown')) {
    return tt('sc.commitIdentityHint');
  }
  if (action === 'pull' && raw.includes('couldn\'t find remote ref')) {
    return tt('sc.pullRemoteBranchMissing');
  }
  if (action === 'pull' && raw.includes('there is no tracking information')) {
    return tt('sc.pullTrackingMissing');
  }
  if (action === 'push' && raw.includes('has no upstream branch')) {
    return tt('sc.pushUpstreamMissing');
  }
  if (action === 'push' && raw.includes('non-fast-forward')) {
    return tt('sc.pushNonFastForward');
  }
  if (raw.includes('authentication failed') || raw.includes('permission denied') || raw.includes('could not read username')) {
    return tt('sc.authFailed');
  }

  return (err as any)?.message || tt('sc.unknownGitError');
}
