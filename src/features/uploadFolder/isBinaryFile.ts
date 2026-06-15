import { UPLOAD_BINARY_EXTENSIONS } from './uploadBinaryExtensions';

export function isBinaryFile(name: string): boolean {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  return UPLOAD_BINARY_EXTENSIONS.has(ext);
}
