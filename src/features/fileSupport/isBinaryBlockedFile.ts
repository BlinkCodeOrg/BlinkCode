import { BINARY_BLOCKED_EXTENSIONS } from './binaryBlockedExtensions';
import { getExtension } from './getExtension';
import { normalizeFileName } from './normalizeFileName';

export function isBinaryBlockedFile(fileName: string): boolean {
  return BINARY_BLOCKED_EXTENSIONS.has(getExtension(normalizeFileName(fileName)));
}
