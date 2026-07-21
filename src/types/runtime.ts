export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface TerminalLine {
  id: string;
  text: string;
  type: 'input' | 'output' | 'error' | 'info' | 'system';
}

export interface TerminalInstance {
  id: string;
  name: string;
  cwd: string;
  title?: string;
  cursor?: number;
  startupCommand?: string;
  scriptKey?: string;
  status?: 'idle' | 'starting' | 'running' | 'exited' | 'stopped' | 'failed';
  exitCode?: number;
}
