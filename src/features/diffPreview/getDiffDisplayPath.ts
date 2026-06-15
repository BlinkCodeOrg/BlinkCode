export function getDiffDisplayPath(serverPath: string | undefined, fallback: string): string {
  if (!serverPath) return fallback;
  return serverPath.replace(/^__git_diff__\/(staged|unstaged)\//, '');
}
