import { isBinaryFile } from './isBinaryFile';

export async function readFileContent(handle: FileSystemFileHandle, name: string): Promise<string | undefined> {
  try {
    const file = await handle.getFile();
    if (isBinaryFile(name)) {
      const buf = await file.arrayBuffer();
      const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
      return `base64:${b64}`;
    }

    const text = await file.text();
    if (text.length > 500000) return `${text.slice(0, 500000)}\n// ... file truncated`;
    return text;
  } catch {
    return undefined;
  }
}
