export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';
export type DependencyType = 'production' | 'development' | 'optional' | 'peer';

export interface ProjectDependency {
  name: string;
  declaredVersion: string;
  installedVersion: string | null;
  type: DependencyType;
}

export interface DependencyPackage {
  directory: string;
  name: string;
  packageManager: PackageManager;
  dependencies: ProjectDependency[];
}

export interface OutdatedDependency {
  name: string;
  current: string | null;
  wanted: string | null;
  latest: string | null;
}

export interface OutdatedDependenciesResponse {
  outdated: OutdatedDependency[];
  warnings: string[];
}
