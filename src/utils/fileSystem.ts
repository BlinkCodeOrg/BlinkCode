import { uploadFolder } from './api';
import { MAX_DEPTH } from '../features/uploadFolder/maxDepth';
import { readFileContent } from '../features/uploadFolder/readFileContent';
import { SKIP_DIRS } from '../features/uploadFolder/skipDirs';
import { SKIP_FILES } from '../features/uploadFolder/skipFiles';

export interface UploadItem {
  path: string;
  type: 'file' | 'folder';
  content?: string;
}

export async function collectForUpload(
  dirHandle: FileSystemDirectoryHandle,
  prefix: string,
  depth: number
): Promise<UploadItem[]> {
  if (depth >= MAX_DEPTH) return [];
  const items: UploadItem[] = [];

  for await (const [name, handle] of (dirHandle as any).entries()) {
    if (SKIP_DIRS.has(name) || SKIP_FILES.has(name)) continue;
    if (name.startsWith('.') && name !== '.env' && name !== '.gitignore') continue;

    const itemPath = prefix ? `${prefix}/${name}` : name;

    if (handle.kind === 'directory') {
      items.push({ path: itemPath, type: 'folder' });
      const childItems = await collectForUpload(handle, itemPath, depth + 1);
      items.push(...childItems);
    } else {
      const content = await readFileContent(handle, name);
      items.push({ path: itemPath, type: 'file', content });
    }
  }

  return items;
}

export { uploadFolder };
