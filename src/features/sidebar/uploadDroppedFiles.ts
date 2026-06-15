import { createFileOnServer, saveFile } from '../../utils/api';
import { isSidebarUploadBinaryFile } from './isSidebarUploadBinaryFile';

export async function uploadDroppedFiles(files: File[]) {
  const uploaded: string[] = [];
  const failed: string[] = [];
  for (const file of files) {
    const path = file.webkitRelativePath || file.name;
    const isBinary = isSidebarUploadBinaryFile(file.name);
    try {
      await createFileOnServer(path, 'file');
      if (isBinary) {
        const buf = await file.arrayBuffer();
        const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
        await saveFile(path, 'base64:' + b64);
      } else {
        const text = await file.text();
        await saveFile(path, text);
      }
      uploaded.push(path);
    } catch (error) {
      console.error('[drop] failed:', path, error);
      failed.push(path);
    }
  }
  return { failed, uploaded };
}
