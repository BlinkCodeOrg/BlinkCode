import { getExtension } from './getExtension';
import { isSupportedWebFile } from './isSupportedWebFile';
import { normalizeFileName } from './normalizeFileName';

export function getFileSupportInfo(fileName: string): { supported: boolean; reason?: string } {
  if (isSupportedWebFile(fileName)) {
    return { supported: true };
  }

  const normalized = normalizeFileName(fileName);
  const extension = getExtension(normalized);

  if (!extension) {
    return {
      supported: false,
      reason: 'unsupported-name',
    };
  }

  return {
    supported: false,
    reason: 'unsupported-extension',
  };
}
