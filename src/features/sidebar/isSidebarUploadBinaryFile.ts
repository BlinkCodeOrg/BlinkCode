import { SIDEBAR_UPLOAD_BINARY_EXTENSIONS } from './sidebarUploadBinaryExtensions';

export function isSidebarUploadBinaryFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return SIDEBAR_UPLOAD_BINARY_EXTENSIONS.includes(ext);
}
