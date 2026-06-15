import type { EditorSettings } from '../../types';

export interface SettingsResponse {
  defaults: EditorSettings;
  global: Partial<EditorSettings>;
  workspace: Partial<EditorSettings>;
  merged: EditorSettings;
  globalPath: string;
  workspacePath: string | null;
}
