export type DebugStatus = 'idle' | 'starting' | 'running' | 'paused' | 'stopped' | 'failed';

export interface DebugScope {
  type: string;
  name: string;
  objectId: string | null;
}

export interface DebugCallFrame {
  id: string;
  functionName: string;
  path: string;
  line: number;
  column: number;
  scopes: DebugScope[];
}

export interface DebugOutputLine {
  stream: 'stdout' | 'stderr' | 'console';
  text: string;
}

export interface DebugBreakpoint {
  id: string;
  path: string;
  line: number;
  enabled: boolean;
  condition?: string;
  verified?: boolean;
  message?: string;
}

export interface DebugConfiguration {
  name: string;
  type: string;
  request: 'launch' | 'attach';
  program?: string;
  cwd?: string;
  runtimeExecutable?: string;
  runtimeArgs?: string[];
  args?: string[];
  env?: Record<string, string>;
  address?: string;
  port?: number;
  webSocketUrl?: string;
  stopOnEntry?: boolean;
}

export interface DebugConfigurationsResponse {
  exists: boolean;
  path: string;
  configurations: DebugConfiguration[];
}

export interface DebugSessionState {
  status: DebugStatus;
  connected?: boolean;
  filePath?: string;
  breakpoints: number[];
  breakpointDetails?: DebugBreakpoint[];
  callFrames: DebugCallFrame[];
  output: DebugOutputLine[];
  sessionName?: string;
  request?: 'launch' | 'attach';
  pauseReason?: string | null;
  exitCode?: number | null;
  error?: string;
}

export interface DebugVariable {
  name: string;
  type: string;
  value: string | number | boolean | null;
  objectId: string | null;
}
