import type { FileNode } from '../../types';

export function isUnsupportedTextFile(file: FileNode | null | undefined, supportInfo: { supported: boolean }, settingsFile: boolean): boolean {
  return Boolean(file && !file.binary && !supportInfo.supported && !settingsFile);
}
