export async function writeProjectToDirectoryHandle(
  parent: FileSystemDirectoryHandle,
  projectName: string,
  files: Record<string, string>,
): Promise<string> {
  try {
    await parent.getDirectoryHandle(projectName);
    throw new Error(`Folder "${projectName}" already exists`);
  } catch (error) {
    if ((error as DOMException)?.name !== 'NotFoundError') throw error;
  }

  const project = await parent.getDirectoryHandle(projectName, { create: true });
  try {
    for (const [relativePath, content] of Object.entries(files)) {
      const parts = relativePath.split('/');
      const fileName = parts.pop();
      if (!fileName) continue;

      let directory = project;
      for (const part of parts) {
        directory = await directory.getDirectoryHandle(part, { create: true });
      }

      const file = await directory.getFileHandle(fileName, { create: true });
      const writable = await file.createWritable();
      await writable.write(content);
      await writable.close();
    }
  } catch (error) {
    await parent.removeEntry(projectName, { recursive: true }).catch(() => {});
    throw error;
  }

  return `${parent.name}/${projectName}`;
}
