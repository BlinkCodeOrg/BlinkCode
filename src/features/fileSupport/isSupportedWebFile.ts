import { getExtension } from './getExtension';
import { isEnvFile } from './isEnvFile';
import { normalizeFileName } from './normalizeFileName';
import { SUPPORTED_EXTENSIONS } from './supportedExtensions';
import { SUPPORTED_FILE_NAMES } from './supportedFileNames';

export function isSupportedWebFile(fileName: string): boolean {
  const normalized = normalizeFileName(fileName);

  if (!normalized) return false;
  if (SUPPORTED_FILE_NAMES.has(normalized)) return true;
  if (isEnvFile(normalized)) return true;

  const extension = getExtension(normalized);
  return SUPPORTED_EXTENSIONS.has(extension);
}
