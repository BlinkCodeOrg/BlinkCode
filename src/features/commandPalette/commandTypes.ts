import type { ReactNode } from 'react';

export type CommandCategory =
  | 'View'
  | 'File'
  | 'Edit'
  | 'Navigation'
  | 'Appearance'
  | 'Browser'
  | 'AI'
  | 'Workspace';

export interface Command {
  id: string;
  title: string;
  category: CommandCategory;
  icon?: ReactNode;
  shortcut?: string;
  description?: string;
  when?: () => boolean;
  run: () => void | Promise<void>;
}
