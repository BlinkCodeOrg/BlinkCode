import type { NpmScriptPackage, WebWorkflowAnalysis } from '../../utils/api';

const LOCAL_URL_PATTERN = /https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?:\/[^\s'"<>]*)?/gi;
const LAST_PREVIEW_URL_KEY = 'blinkcode-web-app-center-preview-url';

function workspaceKey(workspaceDir: string) {
  return workspaceDir || '__empty_workspace__';
}

export function readStoredPreviewUrl(workspaceDir: string): string | null {
  try {
    const store = JSON.parse(localStorage.getItem(LAST_PREVIEW_URL_KEY) || '{}');
    return typeof store[workspaceKey(workspaceDir)] === 'string' ? store[workspaceKey(workspaceDir)] : null;
  } catch {
    return null;
  }
}

export function writeStoredPreviewUrl(workspaceDir: string, url: string): void {
  try {
    const store = JSON.parse(localStorage.getItem(LAST_PREVIEW_URL_KEY) || '{}');
    store[workspaceKey(workspaceDir)] = url;
    localStorage.setItem(LAST_PREVIEW_URL_KEY, JSON.stringify(store));
  } catch (error) {
    console.warn('[BlinkCode:web-app-center] Could not persist preview URL', error);
  }
}

export function findLocalUrls(value: string): string[] {
  return value.match(LOCAL_URL_PATTERN) || [];
}

export function uniqueLocalUrls(urls: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  return urls.filter((url): url is string => {
    if (!url || seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}

export function choosePrimaryPackage(packages: NpmScriptPackage[], workflow: WebWorkflowAnalysis | null) {
  const workflowPackages = workflow?.packages || [];
  return (
    packages.find(item => item.directory === '.')
    || workflowPackages.find(item => item.directory === '.')
    || packages.find(item => item.packageManager === 'npm')
    || workflowPackages.find(item => item.packageManager === 'npm')
    || packages[0]
    || workflowPackages[0]
    || null
  );
}

export function filterNpmPackages(packages: NpmScriptPackage[], query: string): NpmScriptPackage[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return packages;
  return packages
    .map(npmPackage => ({
      ...npmPackage,
      scripts: npmPackage.scripts.filter(script => (
        script.name.toLowerCase().includes(normalized)
        || script.command.toLowerCase().includes(normalized)
        || npmPackage.name.toLowerCase().includes(normalized)
      )),
    }))
    .filter(npmPackage => npmPackage.scripts.length > 0);
}
