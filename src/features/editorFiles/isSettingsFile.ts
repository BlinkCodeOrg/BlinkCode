import type { FileNode } from '../../types';

export function isSettingsFile(file: FileNode | null | undefined): boolean {
  return Boolean(file?.serverPath?.startsWith('__settings__/'));
}
