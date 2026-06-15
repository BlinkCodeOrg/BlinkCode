export { getLanguageFromFileName } from '../features/fileLanguage/getLanguageFromFileName';
import { defaultIcon, extMap, nameMap, type FileIconInfo } from '../features/fileIcons/fileIconMaps';
export type { FileIconInfo } from '../features/fileIcons/fileIconMaps';

export function getFileIcon(fileName: string): FileIconInfo {
  if (nameMap[fileName]) return nameMap[fileName];
  const ext = fileName.startsWith('.') ? fileName.slice(1) : (fileName.split('.').pop()?.toLowerCase() || '');
  if (extMap[ext]) return extMap[ext];
  return defaultIcon;
}
