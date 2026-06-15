import type { LspSession } from './monacoAdapter';

export type Monaco = any;
export type MonacoModel = any;
export type ServerKey = 'typescript' | 'html' | 'css' | 'json';

export interface CachedSession {
  session: LspSession;
  serverKey: string;
  workspacePath: string;
}
