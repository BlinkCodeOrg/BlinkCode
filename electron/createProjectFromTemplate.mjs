import { mkdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

export async function createProjectFromTemplate(parentPath, projectName, files) {
  if (typeof parentPath !== 'string' || !path.isAbsolute(parentPath)) throw new Error('Invalid destination folder');
  if (typeof projectName !== 'string' || !projectName.trim() || projectName === '.' || projectName === '..' || /[<>:"/\\|?*]/.test(projectName)) {
    throw new Error('Invalid project folder name');
  }
  if (!files || typeof files !== 'object' || Array.isArray(files) || Object.keys(files).length > 200) {
    throw new Error('Invalid project template');
  }

  const parentStats = await stat(parentPath);
  if (!parentStats.isDirectory()) throw new Error('Destination is not a folder');
  const projectPath = path.join(parentPath, projectName.trim());
  await mkdir(projectPath);

  try {
    for (const [relativePath, content] of Object.entries(files)) {
      const normalized = path.normalize(String(relativePath));
      const targetPath = path.resolve(projectPath, normalized);
      const relative = path.relative(projectPath, targetPath);
      if (!relative || relative.startsWith('..') || path.isAbsolute(relative) || typeof content !== 'string') {
        throw new Error('Invalid template file path');
      }
      await mkdir(path.dirname(targetPath), { recursive: true });
      await writeFile(targetPath, content, 'utf8');
    }
    return { projectPath };
  } catch (error) {
    await rm(projectPath, { recursive: true, force: true });
    throw error;
  }
}
