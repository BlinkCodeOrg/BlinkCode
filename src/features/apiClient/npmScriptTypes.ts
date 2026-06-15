export interface NpmScriptItem {
  name: string;
  command: string;
}

export interface NpmScriptPackage {
  directory: string;
  name: string;
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun';
  scripts: NpmScriptItem[];
}
