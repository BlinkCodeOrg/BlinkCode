import type { AiConfig } from '../ai/aiConfig';

export interface AiContext {
  activeFile?: { path: string; language?: string; content: string };
  selection?: string;
  openFiles?: string[];
  workspaceFiles?: string[];
  searchResults?: string[];
}

export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiToolCall {
  id: string;
  name: 'read_file' | 'search' | 'write_file' | 'replace_in_file' | 'run_command';
  arguments: Record<string, unknown>;
}

export interface AiRequestBase {
  config: AiConfig;
}
