import { buildProjectTemplateFiles } from './buildProjectTemplateFiles';
import type { ProjectTemplate } from './projectTemplates';
import { writeProjectToDirectoryHandle } from './writeProjectToDirectoryHandle';

interface ProjectDestination {
  directoryHandle?: FileSystemDirectoryHandle;
  nativePath?: string;
}

export async function createProjectFromTemplate(
  template: ProjectTemplate,
  projectName: string,
  packageManager: 'npm' | 'pnpm' | 'yarn',
  destination: ProjectDestination,
) {
  const name = projectName.trim();
  if (!name || name === '.' || name === '..' || /[<>:"/\\|?*]/.test(name)) {
    throw new Error('Invalid project folder name');
  }

  const files = buildProjectTemplateFiles(template, name, packageManager);
  if (destination.nativePath) {
    const createProject = window.electronAPI?.createProjectFromTemplate;
    if (!createProject) throw new Error('Desktop project creation is unavailable');
    const result = await createProject({ parentPath: destination.nativePath, projectName: name, files });
    return result.projectPath;
  }

  if (destination.directoryHandle) {
    return writeProjectToDirectoryHandle(destination.directoryHandle, name, files);
  }

  throw new Error('Choose where to save the project');
}
