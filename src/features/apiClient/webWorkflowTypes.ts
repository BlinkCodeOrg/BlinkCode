import type { PackageManager } from './dependencyTypes';
import type { NpmScriptItem } from './npmScriptTypes';

export interface WebWorkflowFlags {
  react?: boolean;
  vite?: boolean;
  typescript?: boolean;
  tailwind?: boolean;
  reactRouter?: boolean;
  next?: boolean;
  vue?: boolean;
  svelte?: boolean;
  vitest?: boolean;
  jest?: boolean;
  playwright?: boolean;
  express?: boolean;
  fastify?: boolean;
  hono?: boolean;
}

export interface WebWorkflowPackage {
  directory: string;
  name: string;
  packageManager: PackageManager;
  scripts: NpmScriptItem[];
  frameworks: WebWorkflowFlags;
  testing: WebWorkflowFlags;
  backend: WebWorkflowFlags;
  hasLockfile: boolean;
}

export interface WebWorkflowDevServerScript {
  packageDirectory: string;
  packageName: string;
  scriptName: string;
  command: string;
  packageManager: PackageManager;
}

export interface WebWorkflowAnalysis {
  workspaceName: string;
  packages: WebWorkflowPackage[];
  frameworks: WebWorkflowFlags;
  testing: WebWorkflowFlags;
  backend: WebWorkflowFlags;
  envFiles: string[];
  restFiles: string[];
  devServerScripts: WebWorkflowDevServerScript[];
  generatedAt: string;
}
